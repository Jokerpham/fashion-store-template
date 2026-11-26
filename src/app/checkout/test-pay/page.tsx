"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useLanguage } from "@/context/LanguageContext";
import { paymentMethodKey, statusLabel } from "@/lib/i18n";

/* Trang thanh toán thử nghiệm (giả lập): chỉ hiện khi cổng chưa có key
   thật hoặc PAYMENTS_SIMULATION=true. Khách bấm "thành công" là đơn được
   đánh dấu đã trả mà KHÔNG trừ tiền thật — dùng để test luồng checkout
   từ đầu tới cuối trước khi gắn key sandbox thật. */
function TestPayInner() {
  const { lang, t } = useLanguage();
  const params = useSearchParams();
  const router = useRouter();
  const orderCode = params.get("order") ?? "";
  const gateway = params.get("gateway") ?? "";
  const [info, setInfo] = useState<{ total: number; status: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!orderCode) return;
    fetch(`/api/payments/status?order=${encodeURIComponent(orderCode)}`)
      .then((r) => r.json())
      .then((d: any) => {
        if (d.total !== undefined) setInfo(d);
      })
      .catch(() => null);
  }, [orderCode]);

  async function simulate(result: "success" | "failed") {
    if (busy) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/payments/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderCode, result }),
    });
    const d = (await r.json()) as Record<string, any>;
    if (!r.ok) {
      setErr(d.error || t("checkout.testPaySimError"));
      setBusy(false);
      return;
    }
    router.push(
      `/checkout/result?gateway=${gateway}&order=${encodeURIComponent(orderCode)}`,
    );
  }

  return (
    <div className="container-x pt-12 pb-20 max-w-xl mx-auto text-center">
      <p className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold tracking-widest px-3 py-1">
        {t("checkout.testPayBadge")}
      </p>
      <h1 className="text-2xl font-light tracking-widest mt-4">{t("checkout.testPayTitle")}</h1>
      <p className="text-neutral-500 mt-3 text-sm">
        {t("checkout.testPayIntroPrefix")}{" "}
        <span className="font-medium text-black">{t("payment." + paymentMethodKey(gateway))}</span>{" "}
        {t("checkout.testPayIntroSuffix")}{" "}
        <span className="font-medium text-black">{t("checkout.testPayNoCharge")}</span>
      </p>
      <div className="border mt-6 text-left text-sm divide-y">
        <div className="flex justify-between px-4 py-3">
          <span className="text-neutral-500">{t("checkout.testPayOrderCode")}</span>
          <span className="font-medium">{orderCode}</span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-neutral-500">{t("checkout.testPayAmount")}</span>
          <span className="font-medium">{info ? formatPrice(info.total) : "..."}</span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-neutral-500">{t("checkout.testPayStatus")}</span>
          <span className="font-medium">{info ? statusLabel(info.status, lang) : "..."}</span>
        </div>
      </div>
      {err && <p className="bg-red-50 text-red-700 text-sm px-4 py-3 mt-4">{err}</p>}
      <div className="grid gap-3 mt-6">
        <button
          onClick={() => simulate("success")}
          disabled={busy}
          className="bg-[#23232c] text-white w-full py-4 tracking-widest text-sm font-heading disabled:opacity-60"
        >
          {t("checkout.testPaySuccess")}
        </button>
        <button
          onClick={() => simulate("failed")}
          disabled={busy}
          className="border w-full py-4 tracking-widest text-sm disabled:opacity-60"
        >
          {t("checkout.testPayFailed")}
        </button>
      </div>
      <p className="text-xs text-neutral-400 mt-5">
        {t("checkout.testPayNote")}
      </p>
      <Link href="/checkout" className="inline-block mt-4 text-sm underline">
        {t("checkout.backToCheckoutLink")}
      </Link>
    </div>
  );
}

export default function TestPayPage() {
  return (
    <Suspense>
      <TestPayInner />
    </Suspense>
  );
}
