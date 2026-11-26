"use client";
/* Báo cáo doanh thu: tổng hợp từ đơn hàng thật trong CSDL. Phía dưới là
   mục "Lịch sử mua hàng & chốt đơn": món khách đã mua, mã đơn, ngày giờ,
   số tiền và trạng thái chốt — để có gì chưa rõ thì vào xem lại. */
import Link from "next/link";
import { useOrders, useProducts, type Order } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";
import { statusLabel, categoryLabel, localeForLang } from "@/lib/i18n";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminReports() {
  const { lang, t } = useLanguage();
  const locale = localeForLang(lang);
  const { orders } = useOrders();
  const { products } = useProducts();

  const live = orders.filter((o) => o.status !== "Đã hủy" && o.status !== "Hoàn trả");
  const revenue = live.reduce((s, o) => s + o.total, 0);
  const done = orders.filter((o) => o.status === "Đã giao");
  const cancelled = orders.filter((o) => o.status === "Đã hủy");

  const byMonth = new Map<string, number>();
  for (const o of live) {
    const k = monthKey(new Date(o.date));
    byMonth.set(k, (byMonth.get(k) ?? 0) + o.total);
  }
  const months = Array.from(byMonth.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-8);
  const maxMonth = Math.max(0, ...months.map(([, v]) => v));

  const nameToCategory = new Map(products.map((p) => [p.name, p.category]));
  /* "Khác" là nhóm dự phòng cho món không tra được danh mục. */
  const byCategory = new Map<string, number>();
  for (const o of live) {
    for (const it of o.items) {
      const cat = nameToCategory.get(it.name) ?? "other";
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + it.price * it.qty);
    }
  }
  const categories = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);

  const history = [...orders].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      <h1 className="text-2xl font-light tracking-wide">{t("admin.reports.title")}</h1>
      <p className="text-sm text-neutral-500 mt-1">{t("admin.reports.subtitle")}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
        {[
          { label: t("admin.reports.revenue"), value: formatPrice(revenue) },
          { label: t("admin.reports.totalOrders"), value: String(orders.length) },
          { label: t("admin.reports.delivered"), value: String(done.length) },
          { label: t("admin.reports.cancelled"), value: String(cancelled.length) },
        ].map((c) => (
          <div key={c.label} className="bg-white p-5 shadow-sm">
            <p className="text-[26px] font-semibold leading-none">{c.value}</p>
            <p className="text-[13px] text-neutral-500 mt-2">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4 mt-8">
        <div className="bg-white shadow-sm p-5 lg:col-span-3">
          <h2 className="font-medium">{t("admin.reports.byMonth")}</h2>
          {months.length === 0 ? (
            <p className="text-sm text-neutral-500 mt-3">{t("admin.reports.noRevenue")}</p>
          ) : (
            <div className="flex items-end gap-3 h-44 mt-6">
              {months.map(([k, v]) => (
                <div key={k} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <p className="text-xs font-medium">{formatPrice(v)}</p>
                  <div
                    className="w-full bg-black"
                    style={{ height: `${maxMonth > 0 ? Math.max(4, Math.round((v / maxMonth) * 100)) : 0}%` }}
                  />
                  <p className="text-xs text-neutral-500">
                    {k.slice(5)}/{k.slice(0, 4)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white shadow-sm p-5 lg:col-span-2">
          <h2 className="font-medium">{t("admin.reports.byCategory")}</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-neutral-500 mt-3">{t("admin.reports.noRevenue")}</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {categories.map(([cat, v]) => (
                <li key={cat} className="flex justify-between gap-2">
                  <span>
                    {cat === "other" ? t("admin.reports.otherCategory") : categoryLabel(cat, lang)}
                  </span>
                  <span className="font-medium">{formatPrice(v)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm mt-8">
        <div className="px-5 py-4 border-b">
          <h2 className="font-medium">{t("admin.reports.history")}</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            {t("admin.reports.historySubtitle")}
          </p>
        </div>
        {history.length === 0 ? (
          <p className="px-5 py-8 text-neutral-500 text-sm">
            {t("admin.reports.historyEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-neutral-500 border-b">
                  <th className="px-5 py-3 font-medium">{t("admin.reports.thOrder")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.reports.thDate")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.reports.thCustomer")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.reports.thItems")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.reports.thAmount")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.reports.thStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((o: Order) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-neutral-50">
                    <td className="px-5 py-3 align-top font-medium">{o.id}</td>
                    <td className="px-5 py-3 align-top whitespace-nowrap">{new Date(o.date).toLocaleString(locale)}</td>
                    <td className="px-5 py-3 align-top">{o.customer.name}</td>
                    <td className="px-5 py-3 align-top">{o.items.map((it) => `${it.name} × ${it.qty}`).join(", ")}</td>
                    <td className="px-5 py-3 align-top font-medium">{formatPrice(o.total)}</td>
                    <td className="px-5 py-3 align-top">
                      {statusLabel(o.status, lang)}
                      {o.status === "Đã giao" && (
                        <span className="ml-2 text-[11px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          {t("admin.reports.closed")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-6 text-sm">
        <Link href="/admin/orders" className="underline">
          {t("admin.reports.manageOrders")}
        </Link>
      </p>
    </div>
  );
}
