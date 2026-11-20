import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteUserSessions, hashPassword, randomSalt } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yeu cau route dong chay Edge Runtime.

/* Đặt lại mật khẩu quản trị khi quên mật khẩu (trang /admin/forgot-password):
   chỉ cần đúng email của một tài khoản quản trị. Mật khẩu mới được băm
   và lưu vào D1; mọi phiên cũ của tài khoản đó bị xoá.
   Lưu ý: bản demo này chưa gửi email xác minh — trước khi bán thật, thay
   bằng luồng token đặt lại gửi qua email (xem README). */
export async function POST(req: Request) {
  let body: Record<string, any>;
  try {
    body = (await req.json()) as Record<string, any>; // Ep kieu: json() suy ra unknown do kieu global cua @cloudflare/workers-types
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const newPassword = String(body.newPassword ?? "");
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Mật khẩu mới cần từ 6 ký tự." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Không tìm thấy tài khoản quản trị với email này." },
      { status: 404 },
    );
  }
  const salt = randomSalt();
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword, salt), salt },
  });
  await deleteUserSessions(user.id);
  return NextResponse.json({ ok: true });
}
