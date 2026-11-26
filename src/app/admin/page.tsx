"use client";
import Link from "next/link";
import { useOrders, useProducts, useMessages, useSubscribers } from "@/lib/store";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { logActivity } from "@/lib/activity";
import { canAccessSection, canDeleteOrder } from "@/lib/roles";
import { formatPrice } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";
import { statusLabel } from "@/lib/i18n";

export default function AdminDashboard() {
  const { lang, t } = useLanguage();
  const { orders, deleteOrder } = useOrders();
  const { products } = useProducts();
  const { messages } = useMessages();
  const { subscribers } = useSubscribers();
  const { user } = useAdminAuth();

  /* Doanh thu không tính đơn đã hủy và đơn hoàn trả. */
  const revenue = orders.filter((o) => o.status !== "Đã hủy" && o.status !== "Hoàn trả").reduce((s, o) => s + o.total, 0);
  const recent = orders.slice(0, 5);
  const canOrders = canAccessSection(user?.role, "orders");
  const canDelete = canDeleteOrder(user?.role);

  const allCards = [
    { label: t("admin.dashboard.revenue"), value: formatPrice(revenue), href: "/admin/orders", section: "orders" as const },
    { label: t("admin.dashboard.orders"), value: String(orders.length), href: "/admin/orders", section: "orders" as const },
    { label: t("admin.dashboard.products"), value: String(products.length), href: "/admin/products", section: "products" as const },
    { label: t("admin.dashboard.messages"), value: String(messages.length), href: "/admin/messages", section: "messages" as const },
    { label: t("admin.dashboard.subscribers"), value: String(subscribers.length), href: "/admin/subscribers", section: "subscribers" as const },
  ];
  const cards = allCards.filter((c) => canAccessSection(user?.role, c.section));

  return (
    <div>
      <h1 className="text-2xl font-light tracking-wide">{t("admin.dashboard.title")}</h1>
      <p className="text-sm text-neutral-500 mt-1">{t("admin.dashboard.subtitle")}</p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-7">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="bg-white p-5 shadow-sm hover:shadow transition-shadow">
            <p className="text-[26px] font-semibold leading-none">{c.value}</p>
            <p className="text-[13px] text-neutral-500 mt-2">{c.label}</p>
          </Link>
        ))}
      </div>

      {canOrders && (
      <div className="bg-white shadow-sm mt-8">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-medium">{t("admin.dashboard.latestOrders")}</h2>
          <Link href="/admin/orders" className="text-sm underline">{t("common.viewAll")}</Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-neutral-500 text-sm">{t("admin.dashboard.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-neutral-500 border-b">
                  <th className="px-5 py-3 font-medium">{t("admin.dashboard.thOrder")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.dashboard.thCustomer")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.dashboard.thTotal")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.dashboard.thStatus")}</th>
                  {canDelete && <th className="px-5 py-3 font-medium text-right">{t("admin.dashboard.thActions")}</th>}
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="px-5 py-3 align-top font-medium">{o.id}</td>
                    <td className="px-5 py-3 align-top">{o.customer.name}</td>
                    <td className="px-5 py-3 align-top">{formatPrice(o.total)}</td>
                    <td className="px-5 py-3 align-top">{statusLabel(o.status, lang)}</td>
                    {canDelete && (
                    <td className="px-5 py-3 align-top text-right">
                      <button title={t("admin.dashboard.deleteOrder")} aria-label={t("admin.dashboard.deleteOrderConfirm", { id: o.id })} onClick={() => { if (confirm(t("admin.dashboard.deleteOrderConfirm", { id: o.id }))) { deleteOrder(o.id); logActivity(user?.email, "Xoá đơn hàng", `Xoá đơn ${o.id} (${o.customer.name}, ${formatPrice(o.total)}).`); } }} className="text-red-600 text-base leading-none">🗑</button>
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
