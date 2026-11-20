import { NextResponse } from "next/server";
import { getSessionUser, type SessionScope } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yeu cau route dong chay Edge Runtime.

/* Tài khoản đang đăng nhập theo scope (?scope=shop|admin): đọc cookie
   phiên, kiểm tra phiên còn hạn trong bảng sessions của D1 rồi trả về
   tài khoản. Trả 401 khi chưa đăng nhập hoặc phiên đã hết hạn. */
export async function GET(req: Request) {
  const scope: SessionScope =
    new URL(req.url).searchParams.get("scope") === "admin" ? "admin" : "shop";
  const user = await getSessionUser(scope);
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }
  return NextResponse.json({ user });
}
