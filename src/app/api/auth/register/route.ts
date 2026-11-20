import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  hashPassword,
  randomSalt,
  sessionCookieOptions,
  toAuthUser,
  type SessionScope,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yeu cau route dong chay Edge Runtime.

/* Đăng ký tài khoản khách hàng mới (phía server): tài khoản lưu trong
   bảng users của D1, mật khẩu băm SHA-256 với salt riêng. Đăng ký xong
   đăng nhập luôn (phiên shop, cookie HttpOnly). */
export async function POST(req: Request) {
  let body: Record<string, any>;
  try {
    body = (await req.json()) as Record<string, any>; // Ep kieu: json() suy ra unknown do kieu global cua @cloudflare/workers-types
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!name || !email.includes("@") || password.length < 6) {
    return NextResponse.json(
      { error: "Hãy nhập đủ tên, email hợp lệ và mật khẩu từ 6 ký tự." },
      { status: 400 },
    );
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email này đã được đăng ký. Vui lòng đăng nhập." },
      { status: 409 },
    );
  }
  const salt = randomSalt();
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password, salt),
      salt,
      role: "customer",
    },
  });
  const scope: SessionScope = "shop";
  const token = await createSession(user.id, scope, true);
  const res = NextResponse.json({ user: toAuthUser(user) }, { status: 201 });
  res.cookies.set("fashion_session", token, sessionCookieOptions(scope, true));
  return res;
}
