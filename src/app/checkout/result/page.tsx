"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/* Trang kết quả sau khi khách quay lại từ cổng thanh toán. KHÔNG tin tham
   số trên URL: gọi /api/payments/verify để hỏi lại cổng phía server rồi
   mới kết luận đã trả hay chưa. */
function ResultInner() {
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
      setMsg("Thiếu mã đơn hàng.");
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
          <h1 className="text-2xl font-light">Đang xác nhận thanh toán...</h1>
          <p className="text-neutral-500 mt-4">Đang hỏi lại cổng thanh toán, bạn chờ một chút.</p>
        </>
      )}
      {state === "paid" && (
        <>
          <h1 className="text-3xl font-light">Thanh toán thành công 🎉</h1>
          <p className="text-neutral-500 mt-4">
            Cảm ơn bạn đã mua sắm tại Fashion Store. Đơn hàng{" "}
            <span className="font-medium text-black">{orderCode}</span> đã được
            thanh toán và sẽ được chuẩn bị giao.
          </p>
          <Link href="/shop" className="inline-block mt-8 bg-[#23232c] text-white px-6 py-3 text-sm tracking-widest">
            TIẾP TỤC MUA SẮM
          </Link>
        </>
      )}
      {state === "pending" && (
        <>
          <h1 className="text-2xl font-light">Đang chờ xác nhận thanh toán</h1>
          <p className="text-neutral-500 mt-4">
            {msg || "Cổng thanh toán chưa báo đã nhận tiền. Nếu bạn đã trả rồi, shop sẽ xác nhận sau khi nhận được tiền — bạn có thể kiểm tra lại đơn sau vài phút."}
          </p>
          <p className="text-neutral-500 mt-2 text-sm">Mã đơn: {orderCode}</p>
          <Link href="/" className="inline-block mt-8 bg-[#23232c] text-white px-6 py-3 text-sm tracking-widest">
            VỀ TRANG CHỦ
          </Link>
        </>
      )}
      {state === "failed" && (
        <>
          <h1 className="text-2xl font-light">Thanh toán chưa thành công</h1>
          <p className="text-neutral-500 mt-4">{msg || "Giao dịch chưa hoàn tất. Bạn thử đặt lại đơn nhé."}</p>
          <Link href="/checkout" className="inline-block mt-8 bg-[#23232c] text-white px-6 py-3 text-sm tracking-widest">
            THỬ LẠI THANH TOÁN
          </Link>
        </>
      )}
      {state === "cancelled" && (
        <>
          <h1 className="text-2xl font-light">Bạn đã hủy thanh toán</h1>
          <p className="text-neutral-500 mt-4">
            Đơn hàng {orderCode} chưa được thanh toán. Bạn có thể quay lại
            thanh toán bất cứ lúc nào.
          </p>
          <Link href="/checkout" className="inline-block mt-8 bg-[#23232c] text-white px-6 py-3 text-sm tracking-widest">
            QUAY LẠI THANH TOÁN
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
