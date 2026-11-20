import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  deleteUserSessions,
  getAdminUser,
  hashPassword,
  randomSalt,
  toAuthUser,
  type AuthUser,
} from "@/lib/auth";
import { ADMIN_ROLES, type StaffRole } from "@/lib/roles";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yeu cau route dong chay Edge Runtime.

/* Quản lý nhân sự phía server (trang /admin/staff, /admin/settings):
   tài khoản nhân sự lưu trong bảng users của D1, mật khẩu băm SHA-256
   với salt. Mọi thao tác đổi dữ liệu chỉ tài khoản admin làm được;
   xem danh sách chỉ cần đang đăng nhập /admin. Các luật cũ giữ nguyên:
   - Không đổi quyền và không xoá tài khoản quản trị gốc
     (admin@store.local) và tài khoản đang đăng nhập.
   - Chỉ quản trị viên mới được sửa số điện thoại.
   - Đổi mật khẩu nhân sự thì các phiên cũ của tài khoản đó bị xoá. */

const ORIGIN_ADMIN_EMAIL = "admin@store.local";
const STAFF_ROLES: StaffRole[] = ["admin", "kho", "cskh", "bientap"];

function validPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 12;
}

function staffRow(u: { name: string; email: string; role: string; phone: string | null }) {
  return { name: u.name, email: u.email, role: u.role as StaffRole, phone: u.phone ?? undefined };
}

async function requireAdmin(): Promise<AuthUser | NextResponse> {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Bạn cần đăng nhập quản trị." }, { status: 401 });
  }
  return admin;
}

function requireAdminRole(admin: AuthUser): NextResponse | null {
  if (admin.role !== "admin") {
    return NextResponse.json(
      { error: "Chỉ quản trị viên mới được làm việc này." },
      { status: 403 },
    );
  }
  return null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const rows = await prisma.user.findMany({
    where: { role: { in: [...ADMIN_ROLES] } },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(rows.map(staffRow));
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const denied = requireAdminRole(admin);
  if (denied) return denied;
  let body: Record<string, any>;
  try {
    body = (await req.json()) as Record<string, any>; // Ep kieu: json() suy ra unknown do kieu global cua @cloudflare/workers-types
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = String(body.role ?? "") as StaffRole;
  const phone = String(body.phone ?? "").trim() || undefined;
  if (!name || !email.includes("@") || password.length < 6) {
    return NextResponse.json(
      { error: "Hãy nhập đủ tên, email và mật khẩu từ 6 ký tự." },
      { status: 400 },
    );
  }
  if (!STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: "Chức danh không hợp lệ." }, { status: 400 });
  }
  if (phone && !validPhone(phone)) {
    return NextResponse.json(
      { error: "Số điện thoại không hợp lệ (cần 9–12 chữ số)." },
      { status: 400 },
    );
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email này đã có tài khoản." }, { status: 409 });
  }
  const salt = randomSalt();
  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password, salt),
      salt,
      role,
      phone,
    },
  });
  return NextResponse.json(staffRow(created), { status: 201 });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const denied = requireAdminRole(admin);
  if (denied) return denied;
  let body: Record<string, any>;
  try {
    body = (await req.json()) as Record<string, any>; // Ep kieu: json() suy ra unknown do kieu global cua @cloudflare/workers-types
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const patch = (body.patch ?? {}) as Record<string, any>;
  const target = await prisma.user.findUnique({ where: { email } });
  if (!target || target.role === "customer") {
    return NextResponse.json({ error: "Không tìm thấy tài khoản nhân sự này." }, { status: 404 });
  }
  // Tài khoản quản trị gốc không đổi quyền; không tự hạ quyền của chính mình.
  if (
    patch.role !== undefined &&
    (email === ORIGIN_ADMIN_EMAIL || email === admin.email.toLowerCase())
  ) {
    return NextResponse.json(
      { error: "Không đổi được quyền của tài khoản này." },
      { status: 403 },
    );
  }
  if (patch.role !== undefined && !STAFF_ROLES.includes(patch.role as StaffRole)) {
    return NextResponse.json({ error: "Chức danh không hợp lệ." }, { status: 400 });
  }
  if (patch.password !== undefined && String(patch.password).length < 6) {
    return NextResponse.json({ error: "Mật khẩu mới cần từ 6 ký tự." }, { status: 400 });
  }
  // SĐT: chỉ quản trị viên mới được sửa (route này đã chốt admin ở trên).
  let phoneToSave: string | null | undefined;
  let phoneChanged = false;
  if (patch.phone !== undefined) {
    const ph = String(patch.phone).trim();
    if (ph && !validPhone(ph)) {
      return NextResponse.json(
        { error: "Số điện thoại không hợp lệ (cần 9–12 chữ số)." },
        { status: 400 },
      );
    }
    phoneToSave = ph || null;
    phoneChanged = true;
  }
  const data: Record<string, any> = {};
  if (patch.name !== undefined) {
    const n = String(patch.name).trim();
    if (n) data.name = n;
  }
  if (patch.role !== undefined) data.role = patch.role;
  if (phoneChanged) data.phone = phoneToSave;
  let passwordChanged = false;
  if (patch.password !== undefined) {
    const salt = randomSalt();
    data.passwordHash = await hashPassword(String(patch.password), salt);
    data.salt = salt;
    passwordChanged = true;
  }
  const updated = await prisma.user.update({ where: { id: target.id }, data });
  if (passwordChanged) await deleteUserSessions(target.id);
  return NextResponse.json(staffRow(updated));
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const denied = requireAdminRole(admin);
  if (denied) return denied;
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (email === ORIGIN_ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "Không xoá được tài khoản quản trị gốc." },
      { status: 403 },
    );
  }
  if (email === admin.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Không tự xoá tài khoản đang đăng nhập." },
      { status: 403 },
    );
  }
  const target = await prisma.user.findUnique({ where: { email } });
  if (!target || target.role === "customer") {
    return NextResponse.json({ error: "Không tìm thấy tài khoản nhân sự này." }, { status: 404 });
  }
  await prisma.user.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}
