"use client";
/* Khách hàng: suy ra từ đơn hàng (gộp theo email, nếu không có email thì
   theo tên + số điện thoại) và tài khoản đã đăng ký (vai trò customer).
   Bấm vào tên khách để xem chi tiết và lịch sử mua hàng; xóa được ở cả
   danh sách và trong khung chi tiết (xóa khách sẽ xóa các đơn của họ và
   tài khoản đã đăng ký tương ứng, có hộp xác nhận). */
import { Fragment, useEffect, useMemo, useState } from "react";
import { useOrders, type Order } from "@/lib/store";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { logActivity } from "@/lib/activity";
import { canDeleteCustomer } from "@/lib/roles";
import { formatPrice } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";
import { statusLabel, localeForLang } from "@/lib/i18n";

type Customer = {
  key: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  orders: Order[];
  orderCount: number;
  totalSpent: number;
  firstDate: string;
};

type StoredAccount = { name: string; email: string; role?: string };

function deriveCustomers(orders: Order[], accounts: StoredAccount[]): Customer[] {
  const map = new Map<string, Customer>();
  for (const o of orders) {
    const email = (o.customer.email || "").trim().toLowerCase();
    const key = email || `${o.customer.name}|${o.customer.phone}`;
    const spent = o.status === "Đã hủy" || o.status === "Hoàn trả" ? 0 : o.total;
    const cur = map.get(key);
    if (!cur) {
      map.set(key, {
        key,
        name: o.customer.name,
        email: o.customer.email || "",
        phone: o.customer.phone,
        address: o.customer.address,
        orders: [o],
        orderCount: 1,
        totalSpent: spent,
        firstDate: o.date,
      });
    } else {
      cur.orders.push(o);
      cur.orderCount += 1;
      cur.totalSpent += spent;
      if (o.date < cur.firstDate) {
        cur.firstDate = o.date;
        cur.address = o.customer.address;
      }
    }
  }
  for (const a of accounts) {
    if (a.role !== "customer") continue;
    const key = a.email.trim().toLowerCase();
    if (!key || map.has(key)) continue;
    map.set(key, {
      key,
      name: a.name,
      email: a.email,
      phone: "",
      address: "",
      orders: [],
      orderCount: 0,
      totalSpent: 0,
      firstDate: "",
    });
  }
  return Array.from(map.values()).sort((x, y) => y.totalSpent - x.totalSpent);
}

export default function AdminCustomers() {
  const { lang, t } = useLanguage();
  const locale = localeForLang(lang);
  const { orders, deleteOrder } = useOrders();
  const { user } = useAdminAuth();
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const canDelete = canDeleteCustomer(user?.role);

  const readAccounts = async () => {
    try {
      const res = await fetch("/api/auth/customers");
      if (!res.ok) {
        setAccounts([]);
        return;
      }
      const rows = (await res.json()) as StoredAccount[];
      setAccounts(Array.isArray(rows) ? rows : []);
    } catch {
      setAccounts([]);
    }
  };
  useEffect(() => {
    readAccounts();
  }, []);

  const customers = useMemo(() => deriveCustomers(orders, accounts), [orders, accounts]);

  const removeCustomer = async (c: Customer) => {
    const extra =
      c.orders.length > 0
        ? t("admin.customers.deleteExtraOrders", { count: c.orders.length })
        : t("admin.customers.deleteExtraAccount");
    if (!confirm(t("admin.customers.deleteConfirm", { name: c.name, extra }))) return;
    for (const o of c.orders) {
      try {
        await deleteOrder(o.id);
      } catch {}
    }
    try {
      await fetch(`/api/auth/customers?email=${encodeURIComponent(c.key)}`, {
        method: "DELETE",
      });
    } catch {}
    logActivity(user?.email, "Xoá khách hàng", `Xoá "${c.name}" (${c.orders.length} đơn).`);
    readAccounts();
    if (openKey === c.key) setOpenKey(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-light tracking-wide">{t("admin.customers.title")}</h1>
      <p className="text-sm text-neutral-500 mt-1">
        {t("admin.customers.subtitle")}
      </p>

      <div className="bg-white shadow-sm mt-6 overflow-x-auto">
        {customers.length === 0 ? (
          <p className="px-5 py-10 text-neutral-500 text-sm">
            {t("admin.customers.empty")}
          </p>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-neutral-500 border-b">
                <th className="px-5 py-3 font-medium">{t("admin.customers.thCustomer")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.customers.thContact")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.customers.thOrderCount")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.customers.thTotalSpent")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.customers.thSince")}</th>
                <th className="px-5 py-3 font-medium text-right">{t("admin.customers.thActions")}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <Fragment key={c.key}>
                  <tr className="border-b hover:bg-neutral-50">
                    <td className="px-5 py-3 align-top">
                      <button
                        onClick={() => setOpenKey(openKey === c.key ? null : c.key)}
                        className="font-medium underline underline-offset-2 text-left"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="px-5 py-3 align-top">
                      {c.email || "—"}
                      <span className="block text-xs text-neutral-400">{c.phone || "—"}</span>
                    </td>
                    <td className="px-5 py-3 align-top">{c.orderCount}</td>
                    <td className="px-5 py-3 align-top font-medium">{formatPrice(c.totalSpent)}</td>
                    <td className="px-5 py-3 align-top whitespace-nowrap">
                      {c.firstDate ? new Date(c.firstDate).toLocaleDateString(locale) : "—"}
                    </td>
                    <td className="px-5 py-3 align-top text-right whitespace-nowrap">
                      <button
                        onClick={() => setOpenKey(openKey === c.key ? null : c.key)}
                        className="underline mr-4"
                      >
                        {t("admin.customers.view")}
                      </button>
                      {canDelete && (
                        <button
                          title={t("admin.customers.deleteCustomer")}
                          aria-label={t("admin.customers.deleteCustomerAria", { name: c.name })}
                          onClick={() => removeCustomer(c)}
                          className="text-red-600 text-base leading-none"
                        >
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                  {openKey === c.key && (
                    <tr className="border-b bg-neutral-50">
                      <td colSpan={6} className="px-5 py-4">
                        <p className="text-sm">
                          <b>{t("admin.customers.addressLabel")}</b> {c.address || "—"}
                          {c.email ? (
                            <>
                              {" "}
                              · <b>{t("admin.customers.emailLabel")}</b> {c.email}
                            </>
                          ) : null}
                          {c.phone ? (
                            <>
                              {" "}
                              · <b>{t("admin.customers.phoneLabel")}</b> {c.phone}
                            </>
                          ) : null}
                        </p>
                        {c.orders.length === 0 ? (
                          <p className="text-sm text-neutral-500 mt-2">{t("admin.customers.noOrders")}</p>
                        ) : (
                          <ul className="mt-2 space-y-1 text-sm">
                            {c.orders.map((o) => (
                              <li key={o.id}>
                                • {o.id} — {new Date(o.date).toLocaleString(locale)} —{" "}
                                {o.items.map((it) => `${it.name} × ${it.qty}`).join(", ")} —{" "}
                                {formatPrice(o.total)} ({statusLabel(o.status, lang)})
                              </li>
                            ))}
                          </ul>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => removeCustomer(c)}
                            className="mt-3 underline text-red-600 text-sm"
                          >
                            {t("admin.customers.deleteThis")}
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
