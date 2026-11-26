"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

/* Trang thanh toán thử nghiệm (giả lập): chỉ hiện khi cổng chưa có key
   thật hoặc PAYMENTS_SIMULATION=true. Khách bấm "thành công" là đơn được
   đánh dấu đã trả mà KHÔNG trừ tiền thật — dùng để test luồng checkout
   từ đầu tới cuối trước khi gắn key sandbox thật. */
const GATEWAY_LABEL: Record<string, string> = {
  payos: "PayOS — VietQR / ATM / ví",
  sepay: "SePay — VietQR chuyển khoản",
  paypal: "PayPal (USD)",
  stripe: "Stripe — Thẻ quốc tế",
};

function TestPayInner() {
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
      setErr(d.error || "Không giả lập được");
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
        THANH TOÁN THỬ NGHIỆM — GIẢ LẬP
      </p>
      <h1 className="text-2xl font-light tracking-widest mt-4">THANH TOÁN THỬ</h1>
      <p className="text-neutral-500 mt-3 text-sm">
        Cổng <span className="font-medium text-black">{GATEWAY_LABEL[gateway] ?? gateway}</span>{" "}
        chưa có key thật (hoặc đang bật chế độ giả lập), nên trang này thay cho
        trang thanh toán thật. <span className="font-medium text-black">Không trừ tiền thật.</span>
      </p>
      <div className="border mt-6 text-left text-sm divide-y">
        <div className="flex justify-between px-4 py-3">
          <span className="text-neutral-500">Mã đơn</span>
          <span className="font-medium">{orderCode}</span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-neutral-500">Số tiền</span>
          <span className="font-medium">{info ? formatPrice(info.total) : "..."}</span>
        </div>
        <div className="flex justify-between px-4 py-3">
          <span className="text-neutral-500">Trạng thái đơn</span>
          <span className="font-medium">{info?.status ?? "..."}</span>
        </div>
      </div>
      {err && <p className="bg-red-50 text-red-700 text-sm px-4 py-3 mt-4">{err}</p>}
      <div className="grid gap-3 mt-6">
        <button
          onClick={() => simulate("success")}
          disabled={busy}
          className="bg-[#23232c] text-white w-full py-4 tracking-widest text-sm font-heading disabled:opacity-60"
        >
          GIẢ LẬP: THANH TOÁN THÀNH CÔNG
        </button>
        <button
          onClick={() => simulate("failed")}
          disabled={busy}
          className="border w-full py-4 tracking-widest text-sm disabled:opacity-60"
        >
          GIẢ LẬP: THANH TOÁN THẤT BẠI
        </button>
      </div>
      <p className="text-xs text-neutral-400 mt-5">
        Khi đã gắn key sandbox thật, khách sẽ sang thẳng trang của cổng (PayOS /
        PayPal / Stripe) hoặc trang quét QR (SePay) thay vì trang này.
      </p>
      <Link href="/checkout" className="inline-block mt-4 text-sm underline">
        Quay lại thanh toán
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
