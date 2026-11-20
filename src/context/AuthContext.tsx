"use client";
/* Tài khoản khách hàng của shop — XÁC THỰC PHÍA SERVER.
   Tài khoản lưu trong bảng users của D1, mật khẩu băm SHA-256 với salt;
   phiên đăng nhập là cookie HttpOnly (fashion_session), kiểm tra lại
   phía server mỗi lần tải trang (/api/auth/me). Không còn tài khoản lưu
   trong localStorage, không còn tài khoản mẫu ghi trong code: tài khoản
   demo demo@store.local / demo123 là hàng trong bảng users (xem file
   fashion-store-d1-insert.sql).
   Khu vực khách hàng chỉ dành cho tài khoản customer: tài khoản quản trị /
   nhân sự đăng nhập riêng ở /admin (AdminAuthContext, cookie riêng
   admin_session), không dùng chung phiên mua sắm. */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { StaffRole } from "@/lib/roles";

export type User = { name: string; email: string; role?: StaffRole | "customer"; phone?: string };
type Result = { ok: boolean; error?: string };
type StaffRow = { name: string; email: string; role: StaffRole; phone?: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<Result>;
  login: (identifier: string, password: string, remember: boolean) => Promise<Result>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<Result>;
  resetPassword: (email: string, newPassword: string) => Promise<Result>;
  /* Quản lý nhân sự (trang /admin/staff, chỉ tài khoản admin): gọi API
     phía server, luật chặn (không đổi quyền/xoá tài khoản gốc, chỉ admin
     sửa SĐT) thực thi ở /api/auth/staff. */
  listStaff: () => Promise<StaffRow[]>;
  createStaff: (name: string, email: string, password: string, role: StaffRole, phone?: string) => Promise<Result>;
  /* caller: giữ lại cho tương thích với code cũ — phía server tự xác định
     người thao tác từ phiên admin, không dùng tham số này. */
  updateStaff: (email: string, patch: { name?: string; role?: StaffRole; password?: string; phone?: string }, caller?: { isAdmin?: boolean; email?: string }) => Promise<Result>;
  deleteStaff: (email: string, callerEmail?: string) => Promise<Result>;
};

const Ctx = createContext<AuthCtx | null>(null);

function toUser(u: { name: string; email: string; role: string; phone?: string | null }): User {
  return { name: u.name, email: u.email, role: u.role as User["role"], phone: u.phone ?? undefined };
}

async function callAuth(path: string, init?: RequestInit): Promise<{ data: any; error?: string }> {
  try {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: (data as Record<string, any>).error || `Lỗi kết nối (${res.status})` };
    }
    return { data };
  } catch {
    return { data: null, error: "Không kết nối được máy chủ. Hãy thử lại." };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục phiên shop từ cookie (kiểm tra phía server).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await callAuth("/api/auth/me?scope=shop");
      if (!cancelled) {
        if (data?.user) setUser(toUser(data.user));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const register: AuthCtx["register"] = async (name, email, password) => {
    const { data, error } = await callAuth("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    if (error || !data?.user) return { ok: false, error: error || "Đăng ký thất bại." };
    setUser(toUser(data.user));
    return { ok: true };
  };

  const login: AuthCtx["login"] = async (identifier, password, remember) => {
    const { data, error } = await callAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password, scope: "shop", remember }),
    });
    if (error || !data?.user) return { ok: false, error: error || "Đăng nhập thất bại." };
    setUser(toUser(data.user));
    return { ok: true };
  };

  const logout = async () => {
    await callAuth("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ scope: "shop" }),
    });
    setUser(null);
  };

  const changePassword: AuthCtx["changePassword"] = async (currentPassword, newPassword) => {
    if (!user) return { ok: false, error: "Bạn cần đăng nhập trước khi đổi mật khẩu." };
    const { error } = await callAuth("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword, scope: "shop" }),
    });
    if (error) return { ok: false, error };
    return { ok: true };
  };

  const resetPassword: AuthCtx["resetPassword"] = async (email, newPassword) => {
    const { error } = await callAuth("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, newPassword }),
    });
    if (error) return { ok: false, error };
    return { ok: true };
  };

  const listStaff: AuthCtx["listStaff"] = async () => {
    const { data } = await callAuth("/api/auth/staff");
    return Array.isArray(data) ? (data as StaffRow[]) : [];
  };

  /* SĐT hợp lệ: 9–12 chữ số (cho phép khoảng trắng, dấu + ở đầu khi nhập). */
  const validPhone = (raw: string): boolean => {
    const digits = raw.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 12;
  };

  const createStaff: AuthCtx["createStaff"] = async (name, email, password, role, phone) => {
    const n = name.trim();
    const e = email.trim().toLowerCase();
    if (!n || !e || password.length < 6) {
      return { ok: false, error: "Hãy nhập đủ tên, email và mật khẩu từ 6 ký tự." };
    }
    const ph = phone?.trim() || undefined;
    if (ph && !validPhone(ph)) {
      return { ok: false, error: "Số điện thoại không hợp lệ (cần 9–12 chữ số)." };
    }
    const { error } = await callAuth("/api/auth/staff", {
      method: "POST",
      body: JSON.stringify({ name: n, email: e, password, role, phone: ph }),
    });
    if (error) return { ok: false, error };
    return { ok: true };
  };

  const updateStaff: AuthCtx["updateStaff"] = async (email, patch) => {
    const e = email.trim().toLowerCase();
    const { error } = await callAuth("/api/auth/staff", {
      method: "PATCH",
      body: JSON.stringify({ email: e, patch }),
    });
    if (error) return { ok: false, error };
    // Đổi tên / SĐT chính mình thì cập nhật luôn phiên đăng nhập đang mở.
    if (e === user?.email?.toLowerCase() && (patch.name || patch.phone !== undefined)) {
      const { data } = await callAuth("/api/auth/me?scope=shop");
      if (data?.user) setUser(toUser(data.user));
    }
    return { ok: true };
  };

  const deleteStaff: AuthCtx["deleteStaff"] = async (email) => {
    const { error } = await callAuth(
      `/api/auth/staff?email=${encodeURIComponent(email.trim().toLowerCase())}`,
      { method: "DELETE" },
    );
    if (error) return { ok: false, error };
    return { ok: true };
  };

  return (
    <Ctx.Provider
      value={{ user, loading, register, login, logout, changePassword, resetPassword, listStaff, createStaff, updateStaff, deleteStaff }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
};
