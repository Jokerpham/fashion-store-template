"use client";
/* Mã giảm giá: mỗi mã gắn cho tất cả sản phẩm, một danh mục, hoặc một sản
   phẩm cụ thể, mỗi mã một mức % riêng. Form thêm mã có ô chọn phạm vi,
   thẻ mã hiện rõ "Áp dụng: …". Mã lưu trên trình duyệt này (bản demo). */
import { useState } from "react";
import {
  useCoupons,
  newCouponId,
  type Coupon,
  type CouponScope,
} from "@/lib/coupons";
import { useProducts } from "@/lib/store";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { productName, categoryLabel } from "@/lib/i18n";
import { logActivity } from "@/lib/activity";
import type { Product } from "@/data/products";

type Form = {
  code: string;
  percent: string;
  scope: CouponScope;
  category: Product["category"];
  productSlug: string;
  active: boolean;
};
const EMPTY: Form = {
  code: "",
  percent: "",
  scope: "all",
  category: "woman",
  productSlug: "",
  active: true,
};

export default function AdminCoupons() {
  const { lang, t } = useLanguage();
  const { coupons, addCoupon, toggleCoupon, deleteCoupon } = useCoupons();
  const { products } = useProducts();
  const { user } = useAdminAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  /* Nhãn "Áp dụng: …" dịch theo ngôn ngữ (scopeLabel trong lib chỉ trả tiếng Việt). */
  const scopeText = (c: Coupon): string => {
    if (c.scope === "category" && c.category) return t("admin.coupons.appliesCategory", { category: categoryLabel(c.category, lang) });
    if (c.scope === "product" && c.productSlug) {
      const p = products.find((x) => x.slug === c.productSlug);
      return t("admin.coupons.appliesProduct", { name: p ? productName(p, lang) : c.productSlug });
    }
    return t("admin.coupons.appliesAll");
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const percent = parseInt(form.percent, 10);
    if (!code || !percent || percent < 1 || percent > 100) {
      setError(t("admin.coupons.errorInvalid"));
      return;
    }
    if (coupons.some((c) => c.code === code)) {
      setError(t("admin.coupons.errorExists"));
      return;
    }
    if (form.scope === "product" && !form.productSlug) {
      setError(t("admin.coupons.errorNoProduct"));
      return;
    }
    const c: Coupon = {
      id: newCouponId(),
      code,
      percent,
      scope: form.scope,
      active: form.active,
      ...(form.scope === "category" ? { category: form.category } : {}),
      ...(form.scope === "product" ? { productSlug: form.productSlug } : {}),
    };
    addCoupon(c);
    logActivity(user?.email, "Tạo mã giảm giá", `Tạo mã ${code} (−${percent}%).`);
    setShowForm(false);
    setForm(EMPTY);
    flash(t("admin.coupons.added", { code }));
  };

  const remove = (c: Coupon) => {
    if (!confirm(t("admin.coupons.deleteConfirm", { code: c.code }))) return;
    deleteCoupon(c.id);
    logActivity(user?.email, "Xoá mã giảm giá", `Xoá mã ${c.code}.`);
    flash(t("admin.coupons.deleted", { code: c.code }));
  };

  const field = "border w-full px-3 py-2.5 outline-none focus:border-black bg-white";
  const label = "block text-sm mb-1 font-medium";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-light tracking-wide">{t("admin.coupons.title")}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {t("admin.coupons.subtitle")}
          </p>
        </div>
        <button
          onClick={() => {
            setForm(EMPTY);
            setError("");
            setShowForm(true);
          }}
          className="bg-black text-white px-4 py-2.5 text-sm tracking-wider hover:bg-neutral-800"
        >
          {t("admin.coupons.add")}
        </button>
      </div>

      {toast && <p className="bg-green-50 text-green-800 text-sm px-4 py-3 mt-6">{toast}</p>}

      {showForm && (
        <form onSubmit={submit} className="bg-white shadow-sm p-5 md:p-6 mt-6">
          <h2 className="font-medium mb-4">{t("admin.coupons.addTitle")}</h2>
          {error && <p className="bg-red-50 text-red-700 text-sm px-3 py-2 mb-4">{error}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={label}>{t("admin.coupons.codeLabel")}</label>
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className={field}
                placeholder={t("admin.coupons.codePlaceholder")}
              />
            </div>
            <div>
              <label className={label}>{t("admin.coupons.percentLabel")}</label>
              <input
                required
                inputMode="numeric"
                value={form.percent}
                onChange={(e) => setForm({ ...form, percent: e.target.value })}
                className={field}
                placeholder={t("admin.coupons.percentPlaceholder")}
              />
            </div>
            <div>
              <label className={label}>{t("admin.coupons.scopeLabel")}</label>
              <select
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value as CouponScope })}
                className={field}
              >
                <option value="all">{t("admin.coupons.scopeAll")}</option>
                <option value="category">{t("admin.coupons.scopeCategory")}</option>
                <option value="product">{t("admin.coupons.scopeProduct")}</option>
              </select>
            </div>
            {form.scope === "category" && (
              <div>
                <label className={label}>{t("admin.coupons.categoryLabel")}</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Product["category"] })}
                  className={field}
                >
                  {(["woman", "man", "accessories", "bags", "footwear"] as Product["category"][]).map((k) => (
                    <option key={k} value={k}>
                      {categoryLabel(k, lang)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {form.scope === "product" && (
              <div>
                <label className={label}>{t("admin.coupons.productLabel")}</label>
                <select
                  value={form.productSlug}
                  onChange={(e) => setForm({ ...form, productSlug: e.target.value })}
                  className={field}
                >
                  <option value="">{t("admin.coupons.pickProduct")}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {productName(p, lang)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                id="coupon-active"
                className="w-4 h-4"
              />
              <label htmlFor="coupon-active" className="text-sm">
                {t("admin.coupons.activeLabel")}
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button className="bg-black text-white px-6 py-2.5 text-sm tracking-wider hover:bg-neutral-800">
              {t("admin.coupons.addSubmit")}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border bg-white px-6 py-2.5 text-sm hover:border-black"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      {coupons.length === 0 ? (
        <div className="bg-white shadow-sm px-5 py-10 mt-6 text-neutral-500 text-sm">
          {t("admin.coupons.empty")}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
          {coupons.map((c) => (
            <div key={c.id} className="bg-white shadow-sm p-5 relative">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="bg-amber-100 text-amber-900 text-sm font-mono px-2.5 py-1">{c.code}</span>
                  <span className="ml-2 font-semibold text-lg">−{c.percent}%</span>
                </div>
                <button
                  title={t("admin.coupons.deleteCode")}
                  aria-label={t("admin.coupons.deleteCodeAria", { code: c.code })}
                  onClick={() => remove(c)}
                  className="text-red-600 text-base leading-none"
                >
                  🗑
                </button>
              </div>
              <p className="text-sm text-neutral-600 mt-3">{t("admin.coupons.applies", { scope: scopeText(c) })}</p>
              <p className="text-sm text-neutral-500 mt-1">{t("admin.coupons.status", { status: c.active ? t("admin.coupons.activeOn") : t("admin.coupons.activeOff") })}</p>
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => toggleCoupon(c.id)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    c.active ? "bg-green-600" : "bg-neutral-300"
                  }`}
                  aria-label={c.active ? t("admin.coupons.disable", { code: c.code }) : t("admin.coupons.enable", { code: c.code })}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      c.active ? "left-6" : "left-0.5"
                    }`}
                  />
                </button>
                <button
                  onClick={() => remove(c)}
                  className="bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700"
                >
                  {t("admin.coupons.deleteButton")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
