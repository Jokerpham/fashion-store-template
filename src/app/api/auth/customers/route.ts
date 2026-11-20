import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser, type AuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yeu cau route dong chay Edge Runtime.

/* Tài khoản khách hàng đã đăng ký (trang /admin/customers): đọc từ bảng
   users trong D1 thay vì localStorage. Xem danh sách chỉ cần đang đăng
   nhập /admin; xoá tài khoản chỉ quản trị viên làm được (đơn hàng của
   khách đó trang quản trị tự xoá riêng qua /api/orders trước). */

async function requireAdmin(): Promise<AuthUser | NextResponse> {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Bạn cần đăng nhập quản trị." }, { status: 401 });
  }
  return admin;
}

export async function GET() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const rows = await prisma.user.findMany({
    where: { role: "customer" },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(
    rows.map((u) => ({ name: u.name, email: u.email, role: u.role, phone: u.phone ?? undefined })),
  );
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  if (admin.role !== "admin") {
    return NextResponse.json(
      { error: "Chỉ quản trị viên mới được xoá khách hàng." },
      { status: 403 },
    );
  }
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase() ?? "";
  const target = await prisma.user.findUnique({ where: { email } });
  if (!target || target.role !== "customer") {
    return NextResponse.json({ error: "Không tìm thấy tài khoản khách hàng này." }, { status: 404 });
  }
  await prisma.user.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}
