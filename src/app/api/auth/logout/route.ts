import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession, type SessionScope } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yeu cau route dong chay Edge Runtime.

/* Đăng xuất phía server: xoá phiên trong bảng sessions và xoá cookie.
   Luôn trả ok, kể cả khi không còn phiên. */
export async function POST(req: Request) {
  let scope: SessionScope = "shop";
  try {
    const body = (await req.json()) as Record<string, any>; // Ep kieu: json() suy ra unknown do kieu global cua @cloudflare/workers-types
    if (body.scope === "admin") scope = "admin";
  } catch {
    // Không có body thì mặc định scope shop.
  }
  const cookieName = scope === "admin" ? "admin_session" : "fashion_session";
  const token = cookies().get(cookieName)?.value;
  if (token) await deleteSession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
