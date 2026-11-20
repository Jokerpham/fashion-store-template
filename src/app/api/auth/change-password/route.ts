import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  deleteSession,
  getSession,
  hashPassword,
  randomSalt,
  verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yeu cau route dong chay Edge Runtime.

/* Đổi mật khẩu của chính tài khoản đang đăng nhập (shop hoặc admin):
   kiểm tra mật khẩu hiện tại với hash trong D1 rồi lưu hash + salt mới.
   Các phiên khác của tài khoản này bị xoá (phiên đang dùng giữ nguyên). */
export async function POST(req: Request) {
  let body: Record<string, any>;
  try {
    body = (await req.json()) as Record<string, any>; // Ep kieu: json() suy ra unknown do kieu global cua @cloudflare/workers-types
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");
  /* scope: "shop" | "admin" — chỉ thử phiên của khu vực đó, tránh trường
     hợp trình duyệt đang giữ cả 2 cookie mà đổi nhầm mật khẩu tài khoản
     bên kia. Không gửi scope thì thử admin trước, rồi shop. */
  const scope = String(body.scope ?? "");
  const scopes: ("shop" | "admin")[] =
    scope === "shop" ? ["shop"] : scope === "admin" ? ["admin"] : ["admin", "shop"];
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Mật khẩu mới cần từ 6 ký tự." }, { status: 400 });
  }
  let session: Awaited<ReturnType<typeof getSession>> = null;
  for (const s of scopes) {
    const found = await getSession(s);
    if (found) {
      session = found;
      break;
    }
  }
  if (!session) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập trước khi đổi mật khẩu." },
      { status: 401 },
    );
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !(await verifyPassword(currentPassword, user.salt, user.passwordHash))) {
    return NextResponse.json({ error: "Mật khẩu hiện tại không đúng." }, { status: 400 });
  }
  const salt = randomSalt();
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword, salt), salt },
  });
  // Xoá mọi phiên khác của tài khoản (mật khẩu cũ mất hiệu lực khắp nơi).
  const others = await prisma.session.findMany({
    where: { userId: user.id },
    select: { token: true },
  });
  for (const s of others) {
    if (s.token !== session.token) await deleteSession(s.token);
  }
  return NextResponse.json({ ok: true });
}
