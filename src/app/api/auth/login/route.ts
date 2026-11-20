import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  sessionCookieOptions,
  toAuthUser,
  verifyPassword,
  type SessionScope,
} from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yeu cau route dong chay Edge Runtime.

/* Đăng nhập phía server: kiểm tra email/mật khẩu với bảng users trong D1,
   tạo phiên trong bảng sessions và đặt cookie HttpOnly. Phân biệt 2 khu
   vực ngay tại server (không chỉ ở giao diện):
   - scope "shop": chỉ tài khoản customer được vào; tài khoản quản trị /
     nhân sự bị chặn và được chỉ sang /admin.
   - scope "admin": chỉ tài khoản nhân sự (admin/kho/cskh/bientap) được
     vào; tài khoản khách hàng bị chặn.
   Không còn tài khoản quản trị ghi cứng trong code: admin@store.local
   cũng đăng nhập bằng mật khẩu đã băm trong bảng users, đổi mật khẩu là
   mật khẩu cũ mất hiệu lực ngay. */
export async function POST(req: Request) {
  let body: Record<string, any>;
  try {
    body = (await req.json()) as Record<string, any>; // Ep kieu: json() suy ra unknown do kieu global cua @cloudflare/workers-types
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  const identifier = String(body.identifier ?? "").trim();
  const password = String(body.password ?? "");
  const scope: SessionScope = body.scope === "admin" ? "admin" : "shop";
  const remember = body.remember === true;
  if (!identifier || !password) {
    return NextResponse.json({ error: "Hãy nhập tài khoản và mật khẩu." }, { status: 400 });
  }
  const idLower = identifier.toLowerCase();
  // Email tra theo dạng chữ thường (lúc đăng ký đã lưu chữ thường);
  // tên tài khoản tra đúng tên như đã đăng ký.
  const user =
    (await prisma.user.findUnique({ where: { email: idLower } })) ??
    (await prisma.user.findFirst({ where: { name: identifier } }));
  const wrongPass =
    scope === "admin"
      ? { error: "Sai tên tài khoản/email hoặc mật khẩu." }
      : {
          error:
            "Sai tên tài khoản/email hoặc mật khẩu. Nếu chưa có tài khoản, hãy chọn tab Đăng ký.",
        };
  if (!user || !(await verifyPassword(password, user.salt, user.passwordHash))) {
    return NextResponse.json(wrongPass, { status: 401 });
  }
  if (scope === "shop") {
    if (user.role !== "customer") {
      return NextResponse.json(
        { error: "Đây là tài khoản quản trị/nhân sự. Hãy đăng nhập ở trang quản trị (/admin)." },
        { status: 403 },
      );
    }
  } else if (!ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
    return NextResponse.json(
      { error: "Tài khoản này không có quyền quản trị. Hãy dùng tài khoản admin hoặc nhân sự." },
      { status: 403 },
    );
  }
  const token = await createSession(user.id, scope, remember);
  const cookieName = scope === "admin" ? "admin_session" : "fashion_session";
  const res = NextResponse.json({ user: toAuthUser(user) });
  res.cookies.set(cookieName, token, sessionCookieOptions(scope, remember));
  return res;
}
