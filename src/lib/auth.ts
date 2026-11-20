/* Xác thực phía server cho Fashion Store (thay cho đăng nhập localStorage cũ).
   - Tài khoản lưu trong bảng users của D1, mật khẩu băm SHA-256 với salt
     riêng từng tài khoản (xem hashPassword).
   - Phiên đăng nhập lưu trong bảng sessions của D1; cookie chỉ chứa token
     phiên (HttpOnly, SameSite=Lax), không chứa thông tin tài khoản.
   - Shop và admin dùng 2 cookie riêng (fashion_session / admin_session)
     và 2 scope riêng (shop / admin): phiên shop không vào được /admin và
     ngược lại, kể cả khi tráo cookie cho nhau.
   File này chỉ dùng phía server (API route, Edge Runtime) — dùng Web
   Crypto, không dùng module Node. */
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { StaffRole } from "@/lib/roles";

export type SessionScope = "shop" | "admin";
export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: StaffRole | "customer";
  phone: string | null;
};

export const SHOP_COOKIE = "fashion_session";
export const ADMIN_COOKIE = "admin_session";
const COOKIE_BY_SCOPE: Record<SessionScope, string> = {
  shop: SHOP_COOKIE,
  admin: ADMIN_COOKIE,
};
const SESSION_TTL_REMEMBER_MS = 7 * 24 * 3600 * 1000; // 7 ngày
const SESSION_TTL_DEFAULT_MS = 24 * 3600 * 1000; // 24 giờ

/* Băm mật khẩu: SHA-256 hex của chuỗi "salt:password" (UTF-8).
   Cùng công thức với scripts/hash-password.cjs (Node) — hash tạo bằng
   script đó sẽ khớp khi kiểm tra ở đây. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomSalt(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(
  password: string,
  salt: string,
  passwordHash: string,
): Promise<boolean> {
  return timingSafeEqual(await hashPassword(password, salt), passwordHash);
}

export function toAuthUser(row: {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
}): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as AuthUser["role"],
    phone: row.phone,
  };
}

/* Tạo phiên mới trong D1, trả về token. remember=true (hoặc phiên admin):
   phiên 7 ngày, ngược lại 24 giờ. */
export async function createSession(
  userId: number,
  scope: SessionScope,
  remember: boolean,
): Promise<string> {
  const token = randomToken();
  const ttl = scope === "admin" || remember ? SESSION_TTL_REMEMBER_MS : SESSION_TTL_DEFAULT_MS;
  await prisma.session.create({
    data: { token, userId, scope, expiresAt: new Date(Date.now() + ttl) },
  });
  return token;
}

/* Xoá một phiên (đăng xuất) hoặc toàn bộ phiên của một tài khoản. */
export async function deleteSession(token: string): Promise<void> {
  await prisma.session.delete({ where: { token } }).catch(() => {});
}

export async function deleteUserSessions(userId: number): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/* Đọc cookie phiên theo scope, kiểm tra phiên còn hạn trong D1 rồi trả về
   tài khoản kèm token phiên. Trả null khi không có cookie, phiên hết hạn
   hoặc sai scope. */
export async function getSession(
  scope: SessionScope,
): Promise<{ user: AuthUser; token: string } | null> {
  const token = cookies().get(COOKIE_BY_SCOPE[scope])?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.scope !== scope || session.expiresAt <= new Date()) return null;
  return { user: toAuthUser(session.user), token };
}

export async function getSessionUser(scope: SessionScope): Promise<AuthUser | null> {
  return (await getSession(scope))?.user ?? null;
}

/* Tài khoản admin đang đăng nhập (dùng cho các route quản lý nhân sự /
   khách hàng). Trả null khi chưa đăng nhập /admin. */
export async function getAdminUser(): Promise<AuthUser | null> {
  return getSessionUser("admin");
}

export function sessionCookieOptions(scope: SessionScope, remember: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge:
      scope === "admin" || remember ? SESSION_TTL_REMEMBER_MS / 1000 : undefined,
  };
}
