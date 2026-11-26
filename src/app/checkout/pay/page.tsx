"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";

/* Trang hiển thị mã VietQR SePay: khách quét mã chuyển khoản, trang tự
   kiểm tra trạng thái đơn mỗi 5 giây — khi webhook SePay báo đã nhận tiền
   thì tự chuyển sang trang kết quả. */
function PayInner() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const router = useRouter();
  const orderCode = params.get("order") ?? "";
  const [info, setInfo] = useState<{
    qrUrl: string;
    bank: string;
    accountNumber: string;
    accountName: string;
    content: string;
    amount: number;
  } | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!orderCode) return;
    fetch("/api/payments/sepay/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderCode }),
    })
      .then((r) => r.json())
      .then((d: any) => {
        if (d.simulation) {
          router.push(
            `/checkout/test-pay?order=${encodeURIComponent(orderCode)}&gateway=sepay`,
          );
        } else if (d.qrUrl) {
          setInfo(d);
        } else {
          setErr(d.error || t("checkout.payQrError"));
        }
      })
      .catch(() => setErr(t("checkout.payServerError")));
  }, [orderCode, router]);

  useEffect(() => {
    if (!info) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(
          `/api/payments/status?order=${encodeURIComponent(orderCode)}`,
        );
        const d = (await r.json()) as Record<string, any>;
        if (d.paymentStatus === "paid" || d.status === "Đã thanh toán") {
          clearInterval(t);
          router.push(
            `/checkout/result?gateway=sepay&order=${encodeURIComponent(orderCode)}`,
          );
        }
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [info, orderCode, router]);

  if (err) {
    return (
      <div className="container-x pt-16 pb-24 text-center">
        <h1 className="text-2xl font-light">{t("checkout.payQrError")}</h1>
        <p className="text-neutral-500 mt-4">{err}</p>
        <Link href="/checkout" className="inline-block mt-6 bg-[#23232c] text-white px-6 py-3 text-sm tracking-widest">
          {t("checkout.backToCheckout")}
        </Link>
      </div>
    );
  }
  if (!info) {
    return (
      <div className="container-x pt-16 pb-24 text-center">
        <p className="text-neutral-500">{t("checkout.payCreating")}</p>
      </div>
    );
  }
  return (
    <div className="container-x pt-12 pb-20 max-w-xl mx-auto text-center">
      <h1 className="text-2xl font-light tracking-widest">{t("checkout.payScanTitle")}</h1>
      <p className="text-neutral-500 mt-3 text-sm">
        {t("checkout.payOrderPrefix")} <span className="font-medium text-black">{orderCode}</span> —{" "}
        {formatPrice(info.amount)}
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={info.qrUrl} alt={t("checkout.payQrAlt")} className="mx-auto mt-6 w-72 h-72 border" />
      <div className="text-left border mt-6 divide-y text-sm">
        <div className="flex justify-between px-4 py-3"><span className="text-neutral-500">{t("checkout.payBank")}</span><span className="font-medium">{info.bank}</span></div>
        <div className="flex justify-between px-4 py-3"><span className="text-neutral-500">{t("checkout.payAccountNumber")}</span><span className="font-medium">{info.accountNumber}</span></div>
        <div className="flex justify-between px-4 py-3"><span className="text-neutral-500">{t("checkout.payAccountName")}</span><span className="font-medium">{info.accountName}</span></div>
        <div className="flex justify-between px-4 py-3"><span className="text-neutral-500">{t("checkout.payTransferNote")}</span><span className="font-medium">{info.content}</span></div>
        <div className="flex justify-between px-4 py-3"><span className="text-neutral-500">{t("checkout.payAmount")}</span><span className="font-medium">{formatPrice(info.amount)}</span></div>
      </div>
      <p className="text-sm text-neutral-500 mt-5">
        {t("checkout.payNote")}
      </p>
      <Link href="/checkout" className="inline-block mt-6 text-sm underline">
        {t("checkout.payCancel")}
      </Link>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense>
      <PayInner />
    </Suspense>
  );
}
