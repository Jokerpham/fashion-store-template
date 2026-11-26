"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

/* Trang kết quả sau khi khách quay lại từ cổng thanh toán. KHÔNG tin tham
   số trên URL: gọi /api/payments/verify để hỏi lại cổng phía server rồi
   mới kết luận đã trả hay chưa. */
function ResultInner() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const gateway = params.get("gateway") ?? "";
  const orderCode = params.get("order") ?? "";
  const sessionId = params.get("session_id") ?? "";
  const cancelled = params.get("cancelled") === "1";
  const [state, setState] = useState<"loading" | "paid" | "pending" | "failed" | "cancelled">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (cancelled) {
      setState("cancelled");
      return;
    }
    if (!orderCode) {
      setState("failed");
      setMsg(t("checkout.missingOrder"));
      return;
    }
    fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gateway, orderCode, sessionId }),
    })
      .then((r) => r.json())
      .then((d: any) => {
        if (d.paid) setState("paid");
        else if (d.status === "failed") setState("failed");
        else setState("pending");
        if (d.message) setMsg(d.message);
      })
      .catch(() => setState("pending"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container-x pt-16 pb-24 text-center max-w-xl mx-auto">
      {state === "loading" && (
        <>
          <h1 className="text-2xl font-light">{t("checkout.resultLoadingTitle")}</h1>
          <p className="text-neutral-500 mt-4">{t("checkout.resultLoadingText")}</p>
        </>
      )}
      {state === "paid" && (
        <>
          <h1 className="text-3xl font-light">{t("checkout.resultPaidTitle")}</h1>
          <p className="text-neutral-500 mt-4">
            {t("checkout.resultPaidPrefix")}{" "}
            <span className="font-medium text-black">{orderCode}</span>{" "}
            {t("checkout.resultPaidSuffix")}
          </p>
          <Link href="/shop" className="inline-block mt-8 bg-[#23232c] text-white px-6 py-3 text-sm tracking-widest">
            {t("checkout.continueShopping")}
          </Link>
        </>
      )}
      {state === "pending" && (
        <>
          <h1 className="text-2xl font-light">{t("checkout.resultPendingTitle")}</h1>
          <p className="text-neutral-500 mt-4">
            {msg || t("checkout.resultPendingDefault")}
          </p>
          <p className="text-neutral-500 mt-2 text-sm">{t("checkout.resultOrderCode", { code: orderCode })}</p>
          <Link href="/" className="inline-block mt-8 bg-[#23232c] text-white px-6 py-3 text-sm tracking-widest">
            {t("misc.backHome")}
          </Link>
        </>
      )}
      {state === "failed" && (
        <>
          <h1 className="text-2xl font-light">{t("checkout.resultFailedTitle")}</h1>
          <p className="text-neutral-500 mt-4">{msg || t("checkout.resultFailedDefault")}</p>
          <Link href="/checkout" className="inline-block mt-8 bg-[#23232c] text-white px-6 py-3 text-sm tracking-widest">
            {t("checkout.tryPaymentAgain")}
          </Link>
        </>
      )}
      {state === "cancelled" && (
        <>
          <h1 className="text-2xl font-light">{t("checkout.resultCancelledTitle")}</h1>
          <p className="text-neutral-500 mt-4">
            {t("checkout.resultCancelledPrefix")} {orderCode}{" "}
            {t("checkout.resultCancelledSuffix")}
          </p>
          <Link href="/checkout" className="inline-block mt-8 bg-[#23232c] text-white px-6 py-3 text-sm tracking-widest">
            {t("checkout.backToCheckout")}
          </Link>
        </>
      )}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultInner />
    </Suspense>
  );
}
