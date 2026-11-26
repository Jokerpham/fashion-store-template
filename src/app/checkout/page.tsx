"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { pushOrder, newId } from "@/lib/store";

type Method = "cod" | "bank" | "momo" | "payos" | "sepay" | "paypal" | "stripe";
const ONLINE: Method[] = ["payos", "sepay", "paypal", "stripe"];
const GATEWAY_LABEL: Record<Method, string> = {
  cod: "COD - Thanh toán khi nhận hàng",
  bank: "Chuyển khoản ngân hàng",
  momo: "Ví MoMo / ZaloPay",
  payos: "PayOS — VietQR / ATM / ví",
  sepay: "SePay — VietQR chuyển khoản",
  paypal: "PayPal (USD)",
  stripe: "Stripe — Thẻ quốc tế",
};

export default function CheckoutPage(){
  const {items,total,clear}=useCart(); const [done,setDone]=useState(false);
  const router = useRouter();
  const [method, setMethod] = useState<Method>("cod");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cfg, setCfg] = useState<{simulation: boolean; methods: Record<string, boolean>; paypalRate: number} | null>(null);

  useEffect(() => {
    fetch("/api/payments/config").then((r) => r.json()).then((d) => setCfg(d as { simulation: boolean; methods: Record<string, boolean>; paypalRate: number })).catch(() => null);
  }, []);

  const usd = cfg ? Math.round((total / cfg.paypalRate) * 100) / 100 : null;
  const isOnline = ONLINE.includes(method);
  const methodConfigured = cfg ? cfg.methods[method] !== false : true;
  const showSimNote = isOnline && cfg && (cfg.simulation || !methodConfigured);

  const radio = (m: Method, label: string, hint?: string) => (
    <label key={m} className={`flex items-start gap-3 border px-4 py-3 cursor-pointer ${method === m ? "border-black bg-neutral-50" : "border-neutral-200"}`}>
      <input type="radio" name="payment" checked={method === m} onChange={() => setMethod(m)} className="mt-1 accent-black" />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-neutral-500 mt-0.5">{hint}</span>}
      </span>
    </label>
  );

  if(done) return <div className="container-x pt-16 pb-24 text-center"><h1 className="text-3xl font-light">Đặt hàng thành công 🎉</h1><p className="text-neutral-500 mt-4">Cảm ơn bạn đã mua sắm tại Fashion Store. Đơn hàng sẽ được xác nhận qua email / điện thoại.</p></div>;
  return (<div className="container-x pt-12 pb-20 grid md:grid-cols-2 gap-12">
    <form onSubmit={async e=>{e.preventDefault(); if (busy) return; setBusy(true); setErr(""); const fd=new FormData(e.currentTarget); const orderId=newId("Fashion Store"); try { await pushOrder({ id:orderId, date:new Date().toISOString(), customer:{ name:String(fd.get("name")||""), phone:String(fd.get("phone")||""), email:String(fd.get("email")||"")||undefined, address:String(fd.get("address")||"") }, items:items.map(i=>({name:i.product.name,size:i.size,qty:i.qty,price:i.product.price})), total, payment:GATEWAY_LABEL[method], status:isOnline?"Chờ thanh toán":"Chờ xác nhận" }); clear(); if (!isOnline) { setDone(true); return; } const res = await fetch(`/api/payments/${method}/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderCode: orderId }) }); const data = (await res.json()) as Record<string, any>; if (data.simulation) { router.push(`/checkout/test-pay?order=${encodeURIComponent(orderId)}&gateway=${method}`); return; } if (!res.ok) throw new Error(data.error || "Không tạo được phiên thanh toán"); if (data.redirectUrl) { window.location.href = data.redirectUrl; return; } if (data.qrUrl) { router.push(`/checkout/pay?order=${encodeURIComponent(orderId)}`); return; } throw new Error("Không nhận được link thanh toán"); } catch (e2: any) { setErr(e2?.message || "Đặt hàng chưa lưu được, bạn kiểm tra lại rồi thử lại nhé."); setBusy(false); }}} className="space-y-4">
      <h1 className="text-2xl font-light tracking-widest">THANH TOÁN</h1>
      <input name="name" required placeholder="Họ và tên" className="border w-full px-4 py-3" /><input name="phone" required placeholder="Số điện thoại" className="border w-full px-4 py-3" /><input name="email" type="email" placeholder="Email" className="border w-full px-4 py-3" /><input name="address" required placeholder="Địa chỉ giao hàng" className="border w-full px-4 py-3" />
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-widest pt-2">PHƯƠNG THỨC THANH TOÁN</p>
        <p className="text-xs text-neutral-500">Thanh toán khi nhận hàng</p>
        {radio("cod", "COD - Thanh toán khi nhận hàng", "Trả tiền mặt khi nhận hàng")}
        <p className="text-xs text-neutral-500 pt-2">Chuyển khoản</p>
        {radio("bank", "Chuyển khoản ngân hàng", "Shop xác nhận sau khi nhận được tiền")}
        {radio("momo", "Ví MoMo / ZaloPay", "Chuyển ví, shop xác nhận thủ công")}
        <p className="text-xs text-neutral-500 pt-2">Thanh toán online — VietQR / ATM / ví (VND)</p>
        {radio("payos", "PayOS — VietQR / ATM / ví", "Quét VietQR, thẻ ATM nội địa, ví điện tử")}
        {radio("sepay", "SePay — VietQR chuyển khoản", "Quét mã VietQR chuyển khoản vào tài khoản shop")}
        <p className="text-xs text-neutral-500 pt-2">Thanh toán quốc tế</p>
        {radio("paypal", "PayPal (USD)", usd !== null ? `Trả bằng tài khoản PayPal hoặc thẻ quốc tế — khoảng $${usd.toFixed(2)}` : "Trả bằng tài khoản PayPal hoặc thẻ quốc tế, tính bằng USD")}
        {radio("stripe", "Stripe — Thẻ quốc tế", "Thẻ Visa / Mastercard / Amex, tính bằng VND")}
        {showSimNote && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">Cổng này chưa có key thật — bấm đặt hàng sẽ sang trang thanh toán thử nghiệm (giả lập, không trừ tiền thật).</p>}
      </div>
      {err && <p className="bg-red-50 text-red-700 text-sm px-4 py-3">{err}</p>}
      <button disabled={busy} className="bg-[#23232c] text-white w-full py-4 tracking-widest text-sm font-heading disabled:opacity-60">{busy ? "ĐANG XỬ LÝ..." : "ĐẶT HÀNG"}</button>
    </form>
    <div><h2 className="font-semibold tracking-widest">ĐƠN HÀNG</h2>
      <div className="space-y-3 mt-5">{items.map((i,idx)=><div key={idx} className="flex justify-between text-sm"><span>{i.product.name} × {i.qty} ({i.size})</span><span>{formatPrice(i.product.price*i.qty)}</span></div>)}</div>
      <div className="border-t mt-6 pt-4 flex justify-between font-semibold"><span>Tổng cộng</span><span>{formatPrice(total)}</span></div>
      {isOnline && usd !== null && method === "paypal" && <p className="text-sm text-neutral-500 mt-2">PayPal tính bằng USD: khoảng ${usd.toFixed(2)} (tỉ giá {cfg?.paypalRate.toLocaleString("vi-VN")}₫/USD).</p>}
    </div>
  </div>);
}
