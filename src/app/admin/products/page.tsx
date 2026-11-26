"use client";
import { Fragment, useState } from "react";
import { useProducts, slugify, type Product } from "@/lib/store";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { logActivity } from "@/lib/activity";
import {
  canDeleteProduct,
  canEditProductContent,
  canEditStock,
  canResetProducts,
} from "@/lib/roles";
import { formatPrice } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";
import { productName, categoryLabel } from "@/lib/i18n";

const CATEGORIES = [
  { id: "woman", label: "Woman" },
  { id: "man", label: "Man" },
  { id: "accessories", label: "Accessories" },
  { id: "bags", label: "Bags" },
  { id: "footwear", label: "Footwear" },
];
/* Nhãn thẻ hiển thị dịch qua admin.products.tag* (xem select bên dưới). */
const TAGS = [{ id: "" }, { id: "best" }, { id: "new" }, { id: "sale" }];

type Form = {
  name: string; slug: string; price: string; oldPrice: string;
  category: string; tag: string; sizes: string; image: string; description: string;
};
const EMPTY: Form = { name: "", slug: "", price: "", oldPrice: "", category: "woman", tag: "", sizes: "S,M,L", image: "", description: "" };

export default function AdminProducts() {
  const { lang, t } = useLanguage();
  const { products, addProduct, updateProduct, updateProductStock, deleteProduct, resetProducts } = useProducts();
  const { user } = useAdminAuth();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState("");
  const [stockEditing, setStockEditing] = useState<{ id: number; name: string; stocks: { size: string; stock: number }[] } | null>(null);
  const [stockError, setStockError] = useState("");

  const canContent = canEditProductContent(user?.role);
  const canStock = canEditStock(user?.role);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(""); setShowForm(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, price: String(p.price), oldPrice: p.oldPrice ? String(p.oldPrice) : "",
      category: p.category, tag: p.tag || "", sizes: p.sizes.join(","),
      image: p.image, description: p.description,
    });
    setError("");
    setShowForm(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const price = parseInt(form.price.replace(/[^\d]/g, ""), 10);
    if (!name || !price) { setError(t("admin.products.errorNamePrice")); return; }
    const slug = (form.slug.trim() || slugify(name));
    if (products.some((p) => p.slug === slug && p.id !== editing?.id)) {
      setError(t("admin.products.errorSlugTaken"));
      return;
    }
    const oldPrice = form.oldPrice ? parseInt(form.oldPrice.replace(/[^\d]/g, ""), 10) : undefined;
    const data: Product = {
      id: editing ? editing.id : Math.max(0, ...products.map((p) => p.id)) + 1,
      slug, name, price,
      ...(oldPrice ? { oldPrice } : {}),
      category: form.category as Product["category"],
      ...((form.tag ? { tag: form.tag } : {}) as object),
      image: form.image.trim() || "/images/products/cotton-t-shirt.jpg",
      description: form.description.trim(),
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
    } as Product;
    if (editing) {
      updateProduct(data);
      const pricePart = editing.price !== price ? ` Giá: ${formatPrice(editing.price)} → ${formatPrice(price)}.` : "";
      logActivity(user?.email, "Sửa sản phẩm", `Sửa "${name}".${pricePart}`);
    } else {
      addProduct(data);
      logActivity(user?.email, "Tạo sản phẩm", `Tạo "${name}" (${formatPrice(price)}).`);
    }
    setShowForm(false);
  };

  const openStockEditor = (p: Product) => {
    const stocks = (p.sizeStocks ?? []).map((s) => ({ size: s.size, stock: s.stock }));
    setStockEditing({ id: p.id, name: p.name, stocks });
    setStockError("");
  };

  const saveStock = async () => {
    if (!stockEditing) return;
    const before = products.find((p) => p.id === stockEditing.id);
    const changes = stockEditing.stocks
      .map((s) => {
        const old = (before?.sizeStocks ?? []).find((x) => x.size === s.size)?.stock;
        return old !== undefined && old !== s.stock ? `${s.size}: ${old} → ${s.stock}` : null;
      })
      .filter(Boolean) as string[];
    try {
      await updateProductStock(stockEditing.id, stockEditing.stocks);
      logActivity(
        user?.email,
        "Sửa tồn kho",
        changes.length > 0
          ? `"${stockEditing.name}": ${changes.join(", ")}.`
          : `Mở sửa tồn kho "${stockEditing.name}" (không đổi số lượng).`,
      );
      setStockEditing(null);
    } catch (err: any) {
      setStockError(err?.message || t("admin.products.errorStockSave"));
    }
  };

  const removeProduct = (p: Product) => {
    if (!confirm(t("admin.products.deleteConfirm", { name: productName(p, lang) }))) return;
    deleteProduct(p.id);
    logActivity(user?.email, "Xoá sản phẩm", `Xoá "${p.name}".`);
  };

  const field = "border w-full px-3 py-2.5 outline-none focus:border-black bg-white";
  const label = "block text-sm mb-1 font-medium";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-light tracking-wide">{t("admin.products.title")}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t("admin.products.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {canResetProducts(user?.role) && (
            <button onClick={() => { if (confirm(t("admin.products.restoreConfirm"))) { resetProducts(); logActivity(user?.email, "Khôi phục sản phẩm mẫu", "Khôi phục danh sách sản phẩm mẫu ban đầu."); } }} className="border bg-white px-4 py-2.5 text-sm hover:border-black">{t("admin.products.restoreSample")}</button>
          )}
          {canContent && (
            <button onClick={openAdd} className="bg-black text-white px-4 py-2.5 text-sm tracking-wider hover:bg-neutral-800">{t("admin.products.addProduct")}</button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white shadow-sm p-5 md:p-6 mt-6">
          <h2 className="font-medium mb-4">{editing ? t("admin.products.editTitle", { name: productName(editing, lang) }) : t("admin.products.addTitle")}</h2>
          {error && <p className="bg-red-50 text-red-700 text-sm px-3 py-2 mb-4">{error}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className={label}>{t("admin.products.nameLabel")}</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} className={field} placeholder={t("admin.products.namePlaceholder")} /></div>
            <div><label className={label}>{t("admin.products.slugLabel")}</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={field} placeholder={t("admin.products.slugPlaceholder")} /></div>
            <div><label className={label}>{t("admin.products.priceLabel")}</label><input required inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={field} placeholder={t("admin.products.pricePlaceholder")} /></div>
            <div><label className={label}>{t("admin.products.oldPriceLabel")}</label><input inputMode="numeric" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} className={field} placeholder={t("admin.products.oldPricePlaceholder")} /></div>
            <div><label className={label}>{t("admin.products.categoryLabel")}</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={field}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{categoryLabel(c.id, lang)}</option>)}</select></div>
            <div><label className={label}>{t("admin.products.tagLabel")}</label><select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className={field}>{TAGS.map((tag) => <option key={tag.id} value={tag.id}>{tag.id === "" ? t("admin.products.tagNone") : tag.id === "best" ? t("admin.products.tagBest") : tag.id === "new" ? t("admin.products.tagNew") : t("admin.products.tagSale")}</option>)}</select></div>
            <div><label className={label}>{t("admin.products.sizesLabel")}</label><input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className={field} placeholder={t("admin.products.sizesPlaceholder")} /></div>
            <div><label className={label}>{t("admin.products.imageLabel")}</label><input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={field} placeholder={t("admin.products.imagePlaceholder")} /></div>
            <div className="md:col-span-2"><label className={label}>{t("admin.products.descriptionLabel")}</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={field} placeholder={t("admin.products.descriptionPlaceholder")} /></div>
          </div>
          {form.image && (
            <div className="mt-4 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.image} alt={t("admin.products.previewAlt")} className="w-16 h-20 object-cover bg-neutral-100" />
              <p className="text-sm text-neutral-500">{t("admin.products.previewNote", { dir: "public/images/products" })}</p>
            </div>
          )}
          <div className="flex gap-2 mt-6">
            <button className="bg-black text-white px-6 py-2.5 text-sm tracking-wider hover:bg-neutral-800">{editing ? t("admin.products.saveChanges") : t("admin.products.addSubmit")}</button>
            <button type="button" onClick={() => setShowForm(false)} className="border bg-white px-6 py-2.5 text-sm hover:border-black">{t("common.cancel")}</button>
          </div>
        </form>
      )}

      {stockError && <p className="bg-red-50 text-red-700 text-sm px-4 py-3 mt-6">{stockError}</p>}

      <div className="bg-white shadow-sm mt-6 overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-left text-neutral-500 border-b">
              <th className="px-5 py-3 font-medium">{t("admin.products.thProduct")}</th>
              <th className="px-5 py-3 font-medium">{t("admin.products.thCategory")}</th>
              <th className="px-5 py-3 font-medium">{t("admin.products.thPrice")}</th>
              <th className="px-5 py-3 font-medium">{t("admin.products.thStock")}</th>
              <th className="px-5 py-3 font-medium">{t("admin.products.thTag")}</th>
              <th className="px-5 py-3 font-medium text-right">{t("admin.products.thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <Fragment key={p.id}>
                <tr className="border-b hover:bg-neutral-50">
                  <td className="px-5 py-3 align-top">
                    <div className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt={productName(p, lang)} className="w-11 h-14 object-cover bg-neutral-100" />
                      <div>
                        <p className="font-medium">{productName(p, lang)}</p>
                        <p className="text-xs text-neutral-400">/product/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 align-top">{categoryLabel(p.category, lang)}</td>
                  <td className="px-5 py-3 align-top">{formatPrice(p.price)}{p.oldPrice && <span className="block text-xs text-neutral-400 line-through">{formatPrice(p.oldPrice)}</span>}</td>
                  <td className="px-5 py-3 align-top">
                    {p.sizeStocks && p.sizeStocks.length > 0 ? (
                      <span>
                        {p.sizeStocks.map((s, i) => (
                          <span key={s.size}>
                            {i > 0 && <span className="text-neutral-300"> · </span>}
                            {s.size}:{" "}
                            <span className={s.stock <= 5 ? "font-semibold text-amber-700" : undefined}>{s.stock}</span>
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-neutral-400">{p.sizes.join(" · ") || "—"}</span>
                    )}
                    {canStock && p.sizeStocks && p.sizeStocks.length > 0 && (
                      <button onClick={() => openStockEditor(p)} className="block underline text-xs mt-1">{t("admin.products.editStock")}</button>
                    )}
                  </td>
                  <td className="px-5 py-3 align-top">{p.tag || "—"}</td>
                  <td className="px-5 py-3 align-top text-right whitespace-nowrap">
                    {canContent && <button onClick={() => openEdit(p)} className="underline mr-4">{t("common.edit")}</button>}
                    {canDeleteProduct(user?.role) && <button onClick={() => removeProduct(p)} className="underline text-red-600">{t("common.delete")}</button>}
                  </td>
                </tr>
                {stockEditing?.id === p.id && (
                  <tr className="border-b bg-neutral-50">
                    <td colSpan={6} className="px-5 py-4">
                      <p className="font-medium text-sm">{t("admin.products.stockTitle", { name: productName(p, lang) })}</p>
                      <p className="text-xs text-neutral-500 mt-1">{t("admin.products.stockNote")}</p>
                      <div className="flex flex-wrap gap-4 mt-3">
                        {stockEditing.stocks.map((s, i) => (
                          <label key={s.size} className="text-sm">
                            {t("admin.products.sizeLabel", { size: s.size })}
                            <input
                              type="number"
                              min={0}
                              value={s.stock}
                              onChange={(e) => {
                                const v = Math.max(0, parseInt(e.target.value || "0", 10) || 0);
                                setStockEditing({
                                  ...stockEditing,
                                  stocks: stockEditing.stocks.map((x, j) => (j === i ? { ...x, stock: v } : x)),
                                });
                              }}
                              className="border bg-white px-2 py-1.5 ml-2 w-20 outline-none focus:border-black"
                            />
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={saveStock} className="bg-black text-white px-5 py-2 text-sm hover:bg-neutral-800">{t("admin.products.saveStock")}</button>
                        <button onClick={() => setStockEditing(null)} className="border bg-white px-5 py-2 text-sm hover:border-black">{t("common.cancel")}</button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
