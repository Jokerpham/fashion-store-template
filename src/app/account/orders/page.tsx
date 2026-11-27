"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/format";
import { localeForLang, paymentMethodKey, statusLabel, type Lang } from "@/lib/i18n";
import type { Order } from "@/lib/store";

/* Trang "Đơn hàng của tôi": khách chỉ xem được đơn của chính mình.
   Đơn lấy từ GET /api/orders?mine=1 — server lọc theo email trong phiên
   đăng nhập (cookie fashion_session), không tin email client gửi lên.
   Huy hiệu trạng thái nằm NGAY BÊN CẠNH phương thức thanh toán:
   - "Đã thanh toán" → xanh lá (shop đã xác nhận nhận được tiền mặt);
   - "Chờ xác nhận" / "Chờ thanh toán" → hổ phách "Chờ thanh toán";
   - trạng thái khác (chuẩn bị hàng, đang giao, đã giao, đã hủy...) →
     hiện đúng nhãn trạng thái đó, nền xám. */

function badgeClass(status: Order["status"]): string {
  if (status === "Đã thanh toán")
    return "border-emerald-200 bg-emerald-100 text-emerald-800";
  if (status === "Chờ xác nhận" || status === "Chờ thanh toán")
    return "border-amber-200 bg-amber-100 text-amber-800";
  return "border-neutral-200 bg-neutral-100 text-neutral-600";
}

function badgeLabel(status: Order["status"], lang: Lang): string {
  if (status === "Chờ xác nhận" || status === "Chờ thanh toán")
    return statusLabel("Chờ thanh toán", lang);
  return statusLabel(status, lang);
}

export default function MyOrdersPage() {
  const { user, loading } = useAuth();
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/account");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/orders?mine=1");
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Order[];
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setErr(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="container-x py-14 max-w-3xl">
        <p className="text-neutral-500">{t("orders.loading")}</p>
      </div>
    );
  }

  return (
    <div className="container-x py-14 max-w-3xl">
      <Link href="/account" className="text-sm text-neutral-500 hover:text-black">
        ← {t("common.back")}
      </Link>
      <h1 className="text-4xl font-light mt-4">{t("orders.title")}</h1>

      {err && (
        <p className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mt-8">
          {t("orders.loadError")}
        </p>
      )}

      {!err && orders === null && (
        <p className="text-neutral-500 mt-8">{t("orders.loading")}</p>
      )}

      {!err && orders !== null && orders.length === 0 && (
        <div className="mt-8 border border-dashed border-neutral-300 px-4 py-8 text-center">
          <p className="text-sm text-neutral-500">{t("orders.empty")}</p>
          <Link
            href="/shop"
            className="mt-4 inline-block bg-[#23232c] px-5 py-2.5 text-sm tracking-widest text-white font-heading"
          >
            {t("checkout.continueShopping")}
          </Link>
        </div>
      )}

      {!err && orders !== null && orders.length > 0 && (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="border p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm">
                  <span className="text-neutral-500">{t("orders.orderCode")}: </span>
                  <span className="font-medium">{o.id}</span>
                </p>
                <p className="text-xs text-neutral-500">
                  {t("orders.date")}:{" "}
                  {new Date(o.date).toLocaleDateString(localeForLang(lang), {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                {t("orders.itemsCount", {
                  count: o.items.reduce((s, i) => s + i.qty, 0),
                })}
                {" · "}
                {o.items.map((i) => i.name).join(", ")}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-neutral-500">{t("orders.paymentMethod")}: </span>
                  <span className="font-medium">
                    {t("payment." + paymentMethodKey(o.payment))}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(o.status)}`}
                  >
                    {badgeLabel(o.status, lang)}
                  </span>
                </p>
                <p className="text-sm font-semibold">{formatPrice(o.total)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
