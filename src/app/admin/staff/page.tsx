"use client";
/* Quản lý nhân sự — tài khoản lưu phía server (bảng users trong D1, mật
   khẩu băm SHA-256 với salt). Chỉ tài khoản admin vào được trang này.
   Tài khoản admin gốc (admin@store.local) không đổi quyền, không xoá;
   không tự hạ quyền hay tự xoá tài khoản đang đăng nhập. */
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ROLE_LABELS, type StaffRole } from "@/lib/roles";
import { logActivity } from "@/lib/activity";
import { useLanguage } from "@/context/LanguageContext";

type Row = { name: string; email: string; role: StaffRole; phone?: string };
type Form = { name: string; email: string; password: string; showPassword: boolean; role: StaffRole; phone: string };
const EMPTY: Form = { name: "", email: "", password: "", showPassword: false, role: "kho", phone: "" };
const ROLES: StaffRole[] = ["admin", "kho", "cskh", "bientap"];

export default function AdminStaff() {
  const { t } = useLanguage();
  /* Nhãn chức danh dịch qua admin.roles.* (ROLE_LABELS trong lib/roles chỉ có tiếng Việt, dùng cho nhật ký). */
  const roleLabel = (r: StaffRole) => t(`admin.roles.${r}`);
  const { user, listStaff, createStaff, updateStaff, deleteStaff } = useAdminAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = async () => setRows(await listStaff());
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  };
  const openEdit = (r: Row) => {
    setEditing(r);
    setForm({ name: r.name, email: r.email, password: "", showPassword: false, role: r.role, phone: r.phone ?? "" });
    setError("");
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const patch: { name?: string; role?: StaffRole; password?: string; phone?: string } = {};
      if (form.name.trim() && form.name.trim() !== editing.name) patch.name = form.name.trim();
      if (form.role !== editing.role) patch.role = form.role;
      if (form.password) patch.password = form.password;
      if (form.phone.trim() !== (editing.phone ?? "")) patch.phone = form.phone.trim();
      if (Object.keys(patch).length === 0) {
        setError(t("admin.staff.errorNoChange"));
        return;
      }
      const r = await updateStaff(editing.email, patch);
      if (!r.ok) {
        setError(r.error || t("admin.staff.errorSave"));
        return;
      }
      if (patch.role) logActivity(user?.email, "Đổi quyền nhân sự", `${editing.email}: ${ROLE_LABELS[editing.role]} → ${ROLE_LABELS[patch.role]}.`);
      if (patch.password) logActivity(user?.email, "Đặt lại mật khẩu nhân sự", `Đặt lại mật khẩu cho ${editing.email}.`);
      if (patch.name) logActivity(user?.email, "Sửa nhân sự", `Đổi tên ${editing.email} thành "${patch.name}".`);
      setNotice(t("admin.staff.saved", { email: editing.email }));
      setShowForm(false);
      refresh();
      return;
    }
    const r = await createStaff(form.name, form.email, form.password, form.role, form.phone.trim() || undefined);
    if (!r.ok) {
      setError(r.error || t("admin.staff.errorCreate"));
      return;
    }
    logActivity(user?.email, "Tạo nhân sự", `Tạo ${form.email} (${ROLE_LABELS[form.role]}).`);
    setNotice(t("admin.staff.created", { email: form.email.trim().toLowerCase() }));
    setShowForm(false);
    refresh();
  };

  const remove = async (r: Row) => {
    if (!confirm(t("admin.staff.deleteConfirm", { email: r.email }))) return;
    const res = await deleteStaff(r.email);
    if (!res.ok) {
      setError(res.error || t("admin.staff.errorDelete"));
      return;
    }
    logActivity(user?.email, "Xoá nhân sự", `Xoá ${r.email} (${ROLE_LABELS[r.role]}).`);
    setNotice(t("admin.staff.deleted", { email: r.email }));
    refresh();
  };

  const field = "border w-full px-3 py-2.5 outline-none focus:border-black bg-white";
  const label = "block text-sm mb-1 font-medium";
  const isProtected = (r: Row) => r.email.toLowerCase() === "admin@store.local";
  const isSelf = (r: Row) => r.email.toLowerCase() === user?.email?.toLowerCase();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-light tracking-wide">{t("admin.staff.title")}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {t("admin.staff.subtitle")}
          </p>
        </div>
        <button onClick={openAdd} className="bg-black font-heading text-white px-4 py-2.5 text-sm tracking-wider hover:bg-neutral-800">
          {t("admin.staff.add")}
        </button>
      </div>

      {notice && <p className="bg-green-50 text-green-800 text-sm px-4 py-3 mt-6">{notice}</p>}
      {error && <p className="bg-red-50 text-red-700 text-sm px-4 py-3 mt-6">{error}</p>}

      {showForm && (
        <form onSubmit={submit} className="bg-white shadow-sm p-5 md:p-6 mt-6">
          <h2 className="font-medium mb-4">{editing ? t("admin.staff.editTitle", { email: editing.email }) : t("admin.staff.addTitle")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={label}>{t("admin.staff.nameLabel")}</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} placeholder={t("admin.staff.namePlaceholder")} />
            </div>
            <div>
              <label className={label}>{t("admin.staff.emailLabel")}</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={field}
                placeholder={t("admin.staff.emailPlaceholder")}
                disabled={!!editing}
              />
            </div>
            <div>
              <label className={label}>{editing ? t("admin.staff.passwordLabelEdit") : t("admin.staff.passwordLabelNew")}</label>
              <div className="flex gap-2">
                <input
                  required={!editing}
                  type={form.showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={field}
                  placeholder={t("admin.staff.passwordPlaceholder")}
                />
                <button type="button" onClick={() => setForm({ ...form, showPassword: !form.showPassword })} className="border bg-white px-3 text-sm hover:border-black shrink-0">
                  {form.showPassword ? t("admin.staff.hide") : t("admin.staff.show")}
                </button>
              </div>
            </div>
            <div>
              <label className={label}>{t("admin.staff.phoneLabel")}</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} placeholder={t("admin.staff.phonePlaceholder")} />
            </div>
            <div>
              <label className={label}>{t("admin.staff.roleLabel")}</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                className={field}
                disabled={!!editing && (isProtected(editing) || isSelf(editing))}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{roleLabel(r)}</option>
                ))}
              </select>
              {editing && (isProtected(editing) || isSelf(editing)) && (
                <p className="text-xs text-neutral-500 mt-1">{t("admin.staff.roleLockedNote")}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button className="bg-black font-heading text-white px-6 py-2.5 text-sm tracking-wider hover:bg-neutral-800">
              {editing ? t("admin.staff.saveChanges") : t("admin.staff.addSubmit")}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border bg-white px-6 py-2.5 text-sm hover:border-black">
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white shadow-sm mt-6 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-neutral-500 border-b">
              <th className="px-5 py-3 font-medium">{t("admin.staff.thName")}</th>
              <th className="px-5 py-3 font-medium">{t("admin.staff.thEmail")}</th>
              <th className="px-5 py-3 font-medium">{t("admin.staff.thRole")}</th>
              <th className="px-5 py-3 font-medium">{t("admin.staff.thPhone")}</th>
              <th className="px-5 py-3 font-medium text-right">{t("admin.staff.thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.email} className="border-b last:border-0 hover:bg-neutral-50">
                <td className="px-5 py-3 align-top font-medium">{r.name}</td>
                <td className="px-5 py-3 align-top">{r.email}</td>
                <td className="px-5 py-3 align-top">{roleLabel(r.role)}</td>
                <td className="px-5 py-3 align-top">{r.phone || "—"}</td>
                <td className="px-5 py-3 align-top text-right whitespace-nowrap">
                  <button onClick={() => openEdit(r)} className="underline mr-4">{t("common.edit")}</button>
                  {!isProtected(r) && !isSelf(r) && (
                    <button onClick={() => remove(r)} className="underline text-red-600">{t("common.delete")}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow-sm mt-6 p-5 text-sm text-neutral-600 leading-relaxed">
        <p className="font-medium text-neutral-900">{t("admin.staff.rolesTitle")}</p>
        <ul className="mt-2 space-y-1">
          <li>• <b>{roleLabel("admin")}:</b> {t("admin.staff.roleAdminDesc")}</li>
          <li>• <b>{roleLabel("kho")}:</b> {t("admin.staff.roleKhoDesc")}</li>
          <li>• <b>{roleLabel("cskh")}:</b> {t("admin.staff.roleCskhDesc")}</li>
          <li>• <b>{roleLabel("bientap")}:</b> {t("admin.staff.roleBientapDesc")}</li>
        </ul>
        <p className="mt-2">{t("admin.staff.rolesFootnote")}</p>
      </div>
    </div>
  );
}
