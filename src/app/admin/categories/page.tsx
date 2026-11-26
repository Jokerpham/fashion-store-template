"use client";
/* Quản lý danh mục sản phẩm: đọc bảng categories có sẵn trong CSDL.
   Slug là định danh liên kết với sản phẩm nên chỉ đặt lúc tạo, về sau
   chỉ sửa tên hiển thị. Xoá danh mục còn sản phẩm sẽ bị chặn để không
   đứt liên kết (API trả lỗi, trang hiện lỗi đó). */
import { useState } from "react";
import { useCategories, slugify, type Category } from "@/lib/store";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { logActivity } from "@/lib/activity";
import { useLanguage } from "@/context/LanguageContext";

type Form = { name: string; slug: string };
const EMPTY: Form = { name: "", slug: "" };

export default function AdminCategories() {
  const { t } = useLanguage();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { user } = useAdminAuth();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug });
    setError("");
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError(t("admin.categories.errorName"));
      return;
    }
    try {
      if (editing) {
        await updateCategory(editing.id, name);
        logActivity(user?.email, "Sửa danh mục", `Đổi tên "${editing.name}" thành "${name}".`);
        setNotice(t("admin.categories.renamed", { name }));
      } else {
        const slug = form.slug.trim() || slugify(name);
        await addCategory({ name, slug });
        logActivity(user?.email, "Tạo danh mục", `Tạo "${name}" (/${slug}).`);
        setNotice(t("admin.categories.added", { name }));
      }
      setShowForm(false);
    } catch (err: any) {
      setError(err?.message || t("admin.categories.errorSave"));
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(t("admin.categories.deleteConfirm", { name: c.name }))) return;
    try {
      await deleteCategory(c.id);
      logActivity(user?.email, "Xoá danh mục", `Xoá "${c.name}" (/${c.slug}).`);
      setNotice(t("admin.categories.deleted", { name: c.name }));
    } catch (err: any) {
      setError(err?.message || t("admin.categories.errorDelete"));
    }
  };

  const field = "border w-full px-3 py-2.5 outline-none focus:border-black bg-white";
  const label = "block text-sm mb-1 font-medium";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-light tracking-wide">{t("admin.categories.title")}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {t("admin.categories.subtitle")}
          </p>
        </div>
        <button onClick={openAdd} className="bg-black text-white px-4 py-2.5 text-sm tracking-wider hover:bg-neutral-800">
          {t("admin.categories.add")}
        </button>
      </div>

      {notice && <p className="bg-green-50 text-green-800 text-sm px-4 py-3 mt-6">{notice}</p>}
      {error && <p className="bg-red-50 text-red-700 text-sm px-4 py-3 mt-6">{error}</p>}

      {showForm && (
        <form onSubmit={submit} className="bg-white shadow-sm p-5 md:p-6 mt-6">
          <h2 className="font-medium mb-4">{editing ? t("admin.categories.editTitle", { name: editing.name }) : t("admin.categories.addTitle")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={label}>{t("admin.categories.nameLabel")}</label>
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })
                }
                className={field}
                placeholder={t("admin.categories.namePlaceholder")}
              />
            </div>
            <div>
              <label className={label}>{editing ? t("admin.categories.slugLabelLocked") : t("admin.categories.slugLabel")}</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className={field}
                placeholder={t("admin.categories.slugPlaceholder")}
                disabled={!!editing}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button className="bg-black text-white px-6 py-2.5 text-sm tracking-wider hover:bg-neutral-800">
              {editing ? t("admin.categories.saveChanges") : t("admin.categories.addSubmit")}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="border bg-white px-6 py-2.5 text-sm hover:border-black">
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white shadow-sm mt-6 overflow-x-auto">
        {categories.length === 0 ? (
          <p className="px-5 py-10 text-neutral-500 text-sm">{t("admin.categories.empty")}</p>
        ) : (
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-neutral-500 border-b">
                <th className="px-5 py-3 font-medium">{t("admin.categories.thName")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.categories.thSlug")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.categories.thCount")}</th>
                <th className="px-5 py-3 font-medium text-right">{t("admin.categories.thActions")}</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-neutral-50">
                  <td className="px-5 py-3 align-top font-medium">{c.name}</td>
                  <td className="px-5 py-3 align-top text-neutral-500">/{c.slug}</td>
                  <td className="px-5 py-3 align-top">{c.productCount}</td>
                  <td className="px-5 py-3 align-top text-right whitespace-nowrap">
                    <button onClick={() => openEdit(c)} className="underline mr-4">{t("common.edit")}</button>
                    <button onClick={() => remove(c)} className="underline text-red-600">{t("common.delete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
