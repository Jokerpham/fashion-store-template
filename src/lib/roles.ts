/* Phân quyền nhân sự cho trang quản trị — đăng nhập đã xác thực phía
   server (tài khoản trong bảng users của D1, phiên cookie HttpOnly, xem
   src/context/AdminAuthContext.tsx và src/lib/auth.ts); các route
   /api/auth/* cũng kiểm tra phiên và vai trò phía server. Phân quyền
   dưới đây ẩn/giới hạn giao diện theo vai trò; riêng các API dữ liệu
   của shop (/api/products, /api/orders, ...) vẫn chưa kiểm tra quyền —
   muốn khoá hẳn thì thêm kiểm tra phiên admin vào các route đó.
   Cách chặn thống nhất: tài khoản không có quyền vào một mục sẽ bị đưa về
   /admin (xem AdminLayout); sidebar cũng ẩn luôn các mục đó.
   LƯU Ý: File này KHÔNG có "use client" — nó được dùng chung cho cả
   client (sidebar, trang admin) và server (route /api/auth/login,
   /api/auth/staff dùng ADMIN_ROLES). Thêm "use client" sẽ làm
   ADMIN_ROLES không dùng được trong Edge Runtime và đăng nhập /admin
   lỗi 500 (đã xảy ra 20/11/2026). */

export type StaffRole = "admin" | "kho" | "cskh" | "bientap";
export type AnyRole = StaffRole | "customer";

export const ADMIN_ROLES: StaffRole[] = ["admin", "kho", "cskh", "bientap"];

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Quản trị viên",
  kho: "Nhân viên kho",
  cskh: "Nhân viên CSKH",
  bientap: "Biên tập viên",
};

/* Tiêu đề khối tài khoản ở sidebar: admin giữ đúng dòng cũ "Quản trị viên
   Fashion Store", nhân sự khác hiện chức danh của mình. */
export function sidebarTitle(role: AnyRole | undefined): string {
  if (role === "admin") return "Quản trị viên Fashion Store";
  if (role === "kho" || role === "cskh" || role === "bientap") return ROLE_LABELS[role];
  return "Quản trị viên Fashion Store";
}

export type AdminSection =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "staff"
  | "coupons"
  | "messages"
  | "subscribers"
  | "reports"
  | "activity"
  | "settings";

/* Ma trận quyền theo mục (sidebar + trang). Tài khoản admin thấy tất cả. */
const SECTION_ROLES: Record<AdminSection, StaffRole[]> = {
  dashboard: ["admin", "kho", "cskh", "bientap"],
  products: ["admin", "kho", "bientap"],
  categories: ["admin", "bientap"],
  orders: ["admin", "kho", "cskh"],
  customers: ["admin", "cskh"],
  staff: ["admin"],
  coupons: ["admin", "bientap"],
  messages: ["admin", "cskh"],
  subscribers: ["admin", "cskh"],
  reports: ["admin"],
  activity: ["admin"],
  settings: ["admin"],
};

export function canAccessSection(role: AnyRole | undefined, section: AdminSection): boolean {
  if (!role) return false;
  if (role === "customer") return false;
  return SECTION_ROLES[section].includes(role as StaffRole);
}

export function allowedSections(role: AnyRole | undefined): AdminSection[] {
  return (Object.keys(SECTION_ROLES) as AdminSection[]).filter((s) =>
    canAccessSection(role, s),
  );
}

/* Quyền thao tác nhỏ trong từng trang (ai thấy nút nào). */
export function canEditProductContent(role: AnyRole | undefined): boolean {
  return role === "admin" || role === "bientap";
}
export function canEditStock(role: AnyRole | undefined): boolean {
  return role === "admin" || role === "kho";
}
export function canDeleteProduct(role: AnyRole | undefined): boolean {
  return role === "admin" || role === "bientap";
}
export function canResetProducts(role: AnyRole | undefined): boolean {
  return role === "admin";
}
export function canChangeOrderStatus(role: AnyRole | undefined): boolean {
  return role === "admin" || role === "kho" || role === "cskh";
}
export function canDeleteOrder(role: AnyRole | undefined): boolean {
  return role === "admin";
}
export function canCreateManualOrder(role: AnyRole | undefined): boolean {
  return role === "admin" || role === "cskh";
}
export function canDeleteCustomer(role: AnyRole | undefined): boolean {
  return role === "admin";
}
export function canManageCoupons(role: AnyRole | undefined): boolean {
  return role === "admin" || role === "bientap";
}
export function canDeleteMessage(role: AnyRole | undefined): boolean {
  return role === "admin" || role === "cskh";
}
export function canDeleteSubscriber(role: AnyRole | undefined): boolean {
  return role === "admin" || role === "cskh";
}

/* Ánh xạ đường dẫn admin -> mục quyền. Trả null cho trang không cần chặn
   (trang đăng nhập, quên mật khẩu, trang chuyển hướng). */
export function sectionForPath(pathname: string): AdminSection | null {
  if (pathname === "/admin") return "dashboard";
  const rest = pathname.replace(/^\/admin\//, "");
  const head = rest.split("/")[0];
  const map: Record<string, AdminSection> = {
    products: "products",
    categories: "categories",
    orders: "orders",
    customers: "customers",
    staff: "staff",
    coupons: "coupons",
    messages: "messages",
    subscribers: "subscribers",
    reports: "reports",
    activity: "activity",
    settings: "settings",
  };
  return map[head] ?? null;
}
