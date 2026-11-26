"use client";
/* Hệ thống đăng nhập RIÊNG cho khu vực quản trị (/admin), tách hẳn với
   tài khoản khách hàng của shop — XÁC THỰC PHÍA SERVER.
   - Tài khoản nhân sự lưu trong bảng users của D1, mật khẩu băm SHA-256
     với salt; phiên admin là cookie HttpOnly (admin_session), kiểm tra
     lại phía server mỗi lần tải trang (/api/auth/me?scope=admin).
   - KHÔNG còn tài khoản quản trị ghi cứng trong code: admin@store.local
     cũng đăng nhập bằng mật khẩu đã băm trong bảng users, đổi mật khẩu
     là mật khẩu cũ mất hiệu lực ngay.
   - Tài khoản khách hàng (customer) bị chặn ở /admin — luật này thực thi
     phía server trong /api/auth/login (scope admin), không chỉ ở giao diện.
   - user có cùng hình dạng { name, email, role, phone? } như AuthContext
     để các trang /admin dùng chung cách đọc user?.role / user?.email. */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { StaffRole } from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export type AdminUser = { name: string; email: string; role: StaffRole; phone?: string };
type Result = { ok: boolean; error?: string };

type AdminAuthCtx = {
  user: AdminUser | null;
  loading: boolean;
  adminLogin: (email: string, password: string) => Promise<Result>;
  adminLogout: () => Promise<void>;
  changeAdminPassword: (currentPassword: string, newPassword: string) => Promise<Result>;
  listStaff: () => Promise<{ name: string; email: string; role: StaffRole; phone?: string }[]>;
  createStaff: (name: string, email: string, password: string, role: StaffRole, phone?: string) => Promise<Result>;
  updateStaff: (email: string, patch: { name?: string; role?: StaffRole; password?: string; phone?: string }) => Promise<Result>;
  deleteStaff: (email: string) => Promise<Result>;
};

const Ctx = createContext<AdminAuthCtx | null>(null);

function toAdminUser(u: { name: string; email: string; role: string; phone?: string | null }): AdminUser {
  return { name: u.name, email: u.email, role: u.role as StaffRole, phone: u.phone ?? undefined };
}

async function callAuth(path: string, init?: RequestInit, tr?: (key: string, vars?: Record<string, string | number>) => string): Promise<{ data: any; error?: string }> {
  const t = tr ?? ((key: string, vars?: Record<string, string | number>) => key);
  try {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: (data as Record<string, any>).error || t("auth.connectionError", { status: res.status }) };
    }
    return { data };
  } catch {
    return { data: null, error: t("auth.serverUnreachable") };
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { t } = useLanguage();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục phiên admin từ cookie (kiểm tra phía server).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await callAuth("/api/auth/me?scope=admin", undefined, t);
      if (!cancelled) {
        if (data?.user) setAdmin(toAdminUser(data.user));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const adminLogin: AdminAuthCtx["adminLogin"] = async (email, password) => {
    const { data, error } = await callAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: email.trim(), password, scope: "admin" }),
    }, t);
    if (error || !data?.user) return { ok: false, error: error || t("auth.loginFailed") };
    setAdmin(toAdminUser(data.user));
    return { ok: true };
  };

  const adminLogout = async () => {
    await callAuth("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ scope: "admin" }),
    }, t);
    setAdmin(null);
  };

  const changeAdminPassword: AdminAuthCtx["changeAdminPassword"] = async (currentPassword, newPassword) => {
    if (!admin) return { ok: false, error: t("auth.needLogin") };
    const { error } = await callAuth("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword, scope: "admin" }),
    }, t);
    if (error) return { ok: false, error };
    return { ok: true };
  };

  return (
    <Ctx.Provider
      value={{
        user: admin,
        loading,
        adminLogin,
        adminLogout,
        changeAdminPassword,
        listStaff: auth.listStaff,
        createStaff: auth.createStaff,
        /* Chuyển quyền/email của admin đang đăng nhập cho các hàm quản lý
           nhân sự để chốt chặn SĐT (chỉ admin) và tự sửa/xoá chính mình —
           phía server tự xác định người thao tác từ phiên admin. */
        updateStaff: (email, patch) =>
          auth.updateStaff(email, patch, { isAdmin: admin?.role === "admin", email: admin?.email ?? "" }),
        deleteStaff: (email) => auth.deleteStaff(email, admin?.email ?? ""),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAdminAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return c;
};
