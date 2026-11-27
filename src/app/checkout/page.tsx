"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { pushOrder, newId } from "@/lib/store";
import { useLanguage } from "@/context/LanguageContext";
import { productName, translate, localeForLang } from "@/lib/i18n";

type Method = "cod" | "bank" | "momo" | "zalopay" | "payos" | "sepay" | "paypal" | "stripe";
const ONLINE: Method[] = ["payos", "sepay", "paypal", "stripe"];

export default function CheckoutPage(){
  const {items,total,clear}=useCart(); const [done,setDone]=useState(false);
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [method, setMethod] = useState<Method>("cod");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cfg, setCfg] = useState<{simulation: boolean; methods: Record<string, boolean>; paypalRate: number} | null>(null);

  useEffect(() => {
    fetch("/api/payments/config").then((r) => r.json()).then((d) => setCfg(d as { simulation: boolean; methods: Record<string, boolean>; paypalRate: number })).catch(() => null);
  }, []);

  const usd = cfg ? Math.round((total / cfg.paypalRate) * 100) / 100 : null;
  const usdStr = usd !== null ? `$${usd.toFixed(2)}` : "";
  const rateStr = cfg ? cfg.paypalRate.toLocaleString(localeForLang(lang)) : "";
  const isOnline = ONLINE.includes(method);
  const methodConfigured = cfg ? cfg.methods[method] !== false : true;
  const showSimNote = isOnline && cfg && (cfg.simulation || !methodConfigured);

  // Mã QR mẫu cho từng phương thức thanh toán (xem README, mục
  // "Payments" — chủ shop thay các file này bằng mã QR thật của mình).
  // Mã QR KHÔNG nằm trong khung phương thức: khi khách chọn một phương
  // thức có QR, bảng "quét để thanh toán" hiện ở CỘT PHẢI, phía trên
  // tóm tắt đơn hàng (kiểu web sofa), hạ xuống ngang với mục PAYMENT
  // METHOD để khỏi trôi khỏi màn hình khi cuộn xuống xem các phương
  // thức. Bảng dùng đúng màu thương hiệu của từng bên: xanh
  // Vietcombank/VietQR, hồng MoMo, xanh dương ZaloPay, xanh lá PayOS,
  // xanh ngọc đậm SePay.
  // PayOS/SePay tạo mã QR thật theo từng đơn sau khi đặt hàng; mã ở đây
  // chỉ để minh họa.
  // Độ hạ của bảng: từ đầu cột trái tới chữ "PAYMENT METHOD" là
  // h1 32px + 5 khoảng space-y-4 (80px) + 4 ô nhập × 50px (200px) +
  // pt-2 của tiêu đề (8px) = 320px, cộng thêm 80px để mép trên bảng
  // ngang với các ô phương thức đầu tiên (thay vì ngang với tiêu đề)
  // và toàn bộ bảng (tiêu đề + mã QR + ghi chú) lọt trong một màn
  // hình khi cuộn xuống xem các phương thức = 400px. Chỉ áp từ md
  // trở lên (trên mobile một cột, bảng nằm sau form nên không cần
  // khoảng đệm).
  const QR: Partial<Record<Method, string>> = {
    bank: "/qr/qr-bank.png",
    momo: "/qr/qr-momo.png",
    zalopay: "/qr/qr-zalopay.png",
    payos: "/qr/qr-payos.png",
    sepay: "/qr/qr-sepay.png",
  };
  // Màu thương hiệu từng bên (kiểm tra từ trang chủ payos.vn / sepay.vn):
  // VCB #00693c, MoMo #a50064 / #d82d8a, ZaloPay #008fe5,
  // PayOS #00a75a, SePay #035a4b.
  const QR_COLOR: Partial<Record<Method, { bg: string; border: string; title: string; bracket: string }>> = {
    bank: { bg: "#f0fdf4", border: "#bbf7d0", title: "#00693c", bracket: "#009444" },
    momo: { bg: "#fdf2f8", border: "#fbcfe8", title: "#a50064", bracket: "#d82d8a" },
    zalopay: { bg: "#eff6ff", border: "#bfdbfe", title: "#0068d6", bracket: "#008fe5" },
    payos: { bg: "#f0fdf4", border: "#a7f3d0", title: "#008d50", bracket: "#00a75a" },
    sepay: { bg: "#ecfdf5", border: "#99f6e4", title: "#035a4b", bracket: "#035a4b" },
  };
  const qrLabel: Partial<Record<Method, string>> = {
    bank: t("payment.bank"),
    momo: t("payment.momo"),
    zalopay: t("payment.zalopay"),
    payos: t("payment.payos"),
    sepay: t("payment.sepay"),
  };
  const qrHint: Partial<Record<Method, string>> = {
    bank: t("checkout.bankHint"),
    momo: t("checkout.momoHint"),
    zalopay: t("checkout.zalopayHint"),
    payos: t("checkout.payosHint"),
    sepay: t("checkout.sepayHint"),
  };

  const selQr = QR[method];
  const selQrColor = QR_COLOR[method];

  const radio = (m: Method, label: string, hint?: string) => {
    return (
      <label key={m} className={`flex items-start gap-3 border px-4 py-3 cursor-pointer ${method === m ? "border-black bg-neutral-50" : "border-neutral-200"}`}>
        <input type="radio" name="payment" checked={method === m} onChange={() => setMethod(m)} className="mt-1 accent-black" />
        <span>
          <span className="block text-sm font-medium">{label}</span>
          {hint && <span className="block text-xs text-neutral-500 mt-0.5">{hint}</span>}
        </span>
      </label>
    );
  };

  if(done) return <div className="container-x pt-16 pb-24 text-center"><h1 className="text-3xl font-light">{t("checkout.successTitle")}</h1><p className="text-neutral-500 mt-4">{t("checkout.successText")}</p></div>;
  return (<div className="container-x pt-12 pb-20 grid md:grid-cols-2 gap-12">
    <form onSubmit={async e=>{e.preventDefault(); if (busy) return; setBusy(true); setErr(""); const fd=new FormData(e.currentTarget); const orderId=newId("Fashion Store"); try { await pushOrder({ id:orderId, date:new Date().toISOString(), customer:{ name:String(fd.get("name")||""), phone:String(fd.get("phone")||""), email:String(fd.get("email")||"")||undefined, address:String(fd.get("address")||"") }, items:items.map(i=>({name:i.product.name,size:i.size,qty:i.qty,price:i.product.price})), total, payment:translate("vi", `payment.${method}`), status:isOnline?"Chờ thanh toán":"Chờ xác nhận" }); clear(); if (!isOnline) { setDone(true); return; } const res = await fetch(`/api/payments/${method}/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderCode: orderId }) }); const data = (await res.json()) as Record<string, any>; if (data.simulation) { router.push(`/checkout/test-pay?order=${encodeURIComponent(orderId)}&gateway=${method}`); return; } if (!res.ok) throw new Error(data.error || t("checkout.sessionError")); if (data.redirectUrl) { window.location.href = data.redirectUrl; return; } if (data.qrUrl) { router.push(`/checkout/pay?order=${encodeURIComponent(orderId)}`); return; } throw new Error(t("checkout.noPaymentLink")); } catch (e2: any) { setErr(e2?.message || t("checkout.orderFailed")); setBusy(false); }}} className="space-y-4">
      <h1 className="text-2xl font-light tracking-widest">{t("checkout.title")}</h1>
      <input name="name" required placeholder={t("checkout.namePlaceholder")} className="border w-full px-4 py-3" /><input name="phone" required placeholder={t("checkout.phonePlaceholder")} className="border w-full px-4 py-3" /><input name="email" type="email" placeholder="Email" className="border w-full px-4 py-3" /><input name="address" required placeholder={t("checkout.addressPlaceholder")} className="border w-full px-4 py-3" />
      <div className="space-y-2">
        <p className="text-sm font-semibold tracking-widest pt-2">{t("checkout.paymentTitle")}</p>
        <p className="text-xs text-neutral-500">{t("checkout.codSection")}</p>
        {radio("cod", t("payment.cod"), t("checkout.codHint"))}
        <p className="text-xs text-neutral-500 pt-2">{t("checkout.bankSection")}</p>
        {radio("bank", t("payment.bank"), t("checkout.bankHint"))}
        {radio("momo", t("payment.momo"), t("checkout.momoHint"))}
        {radio("zalopay", t("payment.zalopay"), t("checkout.zalopayHint"))}
        <p className="text-xs text-neutral-500 pt-2">{t("checkout.onlineSection")}</p>
        {radio("payos", t("payment.payos"), t("checkout.payosHint"))}
        {radio("sepay", t("payment.sepay"), t("checkout.sepayHint"))}
        <p className="text-xs text-neutral-500 pt-2">{t("checkout.intlSection")}</p>
        {radio("paypal", t("payment.paypal"), usd !== null ? t("checkout.paypalHintUsd", { usd: usdStr }) : t("checkout.paypalHint"))}
        {radio("stripe", t("payment.stripe"), t("checkout.stripeHint"))}
        {showSimNote && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">{t("checkout.simNote")}</p>}
      </div>
      {err && <p className="bg-red-50 text-red-700 text-sm px-4 py-3">{err}</p>}
      <button disabled={busy} className="bg-[#23232c] text-white w-full py-4 tracking-widest text-sm font-heading disabled:opacity-60">{busy ? t("checkout.processing") : t("checkout.placeOrder")}</button>
    </form>
    <div>
      {selQr && selQrColor && (
        <div className="rounded-xl border px-5 py-5 text-center mb-8 md:mt-[400px]" style={{ backgroundColor: selQrColor.bg, borderColor: selQrColor.border }}>
          <p className="font-semibold" style={{ color: selQrColor.title }}>{qrLabel[method]}</p>
          <div className="relative mx-auto mt-4 h-56 w-56 rounded-lg bg-white p-3">
            <img src={selQr} alt="" className="h-full w-full object-contain" />
            <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-4 border-t-4" style={{ borderColor: selQrColor.bracket }} />
            <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-4 border-t-4" style={{ borderColor: selQrColor.bracket }} />
            <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-4 border-l-4" style={{ borderColor: selQrColor.bracket }} />
            <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-4 border-r-4" style={{ borderColor: selQrColor.bracket }} />
          </div>
          {qrHint[method] && <p className="mt-4 text-sm text-neutral-600">{qrHint[method]}</p>}
        </div>
      )}
      <h2 className="font-semibold tracking-widest">{t("checkout.orderTitle")}</h2>
      <div className="space-y-3 mt-5">{items.map((i,idx)=><div key={idx} className="flex justify-between text-sm"><span>{productName(i.product, lang)} × {i.qty} ({i.size})</span><span>{formatPrice(i.product.price*i.qty)}</span></div>)}</div>
      <div className="border-t mt-6 pt-4 flex justify-between font-semibold"><span>{t("cart.total")}</span><span>{formatPrice(total)}</span></div>
      {isOnline && usd !== null && method === "paypal" && <p className="text-sm text-neutral-500 mt-2">{t("checkout.paypalUsdNote", { usd: usdStr, rate: rateStr })}</p>}
    </div>
  </div>);
}
