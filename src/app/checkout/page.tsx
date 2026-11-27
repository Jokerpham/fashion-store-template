"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import { pushOrder, newId } from "@/lib/store";
import { useLanguage } from "@/context/LanguageContext";
import { productName, statusLabel, translate } from "@/lib/i18n";

type Method = "cod" | "bank" | "momo" | "zalopay" | "payos" | "sepay";
const ONLINE: Method[] = ["payos", "sepay"];

export default function CheckoutPage(){
  const {items,total,clear}=useCart(); const [doneOrder,setDoneOrder]=useState<{ code: string; method: Method } | null>(null);
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [method, setMethod] = useState<Method>("cod");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cfg, setCfg] = useState<{simulation: boolean; methods: Record<string, boolean>} | null>(null);

  useEffect(() => {
    fetch("/api/payments/config").then((r) => r.json()).then((d) => setCfg(d as { simulation: boolean; methods: Record<string, boolean> })).catch(() => null);
  }, []);

  // Tạm tính + phí ship (cùng công thức với /api/orders: phí ship =
  // max(0, total - subtotal)). Giỏ hàng hiện chưa tính phí ship riêng
  // nên total = subtotal, phí ship luôn 0 → hiển thị "Miễn phí vận
  // chuyển"; nếu sau này có phí, dòng này hiện đúng số tiền.
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const shippingFee = Math.max(0, total - subtotal);
  const isOnline = ONLINE.includes(method);
  const methodConfigured = cfg ? cfg.methods[method] !== false : true;
  const showSimNote = isOnline && cfg && (cfg.simulation || !methodConfigured);

  // Mã QR mẫu cho từng phương thức thanh toán (xem README, mục
  // "Payments" — chủ shop thay các file này bằng mã QR thật của mình).
  // Mã QR KHÔNG nằm trong khung phương thức: khi khách chọn một phương
  // thức có QR, bảng "quét để thanh toán" hiện ở CỘT PHẢI, phía dưới
  // tóm tắt đơn hàng (kiểu web sofa), bên cạnh và ngoài các ô phương
  // thức. Tóm tắt đơn hàng (ảnh + tên + số lượng + giá từng món, phí
  // vận chuyển, tổng tiền) nằm TRÊN CÙNG cột phải, ngang với ô thông
  // tin khách hàng bên trái. Bảng QR không còn khoảng đệm trên
  // (md:mt-[400px] của v13/v14 đã bỏ) vì tóm tắt đơn hàng đã đẩy nó
  // xuống ngang tầm các phương thức.
  // PayOS/SePay tạo mã QR thật theo từng đơn sau khi đặt hàng; mã ở đây
  // chỉ để minh họa.
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

  /* Sau khi đặt đơn không qua cổng online (COD / chuyển khoản / ví):
     hiện mã đơn, phương thức thanh toán kèm huy hiệu trạng thái NGAY BÊN
     CẠNH phương thức — lúc này chỉ là "Chờ thanh toán" (hổ phách), chưa
     phải "Đã thanh toán": huy hiệu xanh chỉ hiện khi shop xác nhận đã
     nhận được tiền mặt (đổi trạng thái trong trang quản trị đơn hàng). */
  if(doneOrder) return (
    <div className="container-x pt-16 pb-24 text-center">
      <h1 className="text-3xl font-light">{t("checkout.successTitle")}</h1>
      <p className="text-neutral-500 mt-4">{t("checkout.successText")}</p>
      <div className="mx-auto mt-8 max-w-md border p-6 text-left">
        <p className="text-sm"><span className="text-neutral-500">{t("orders.orderCode")}: </span><span className="font-medium">{doneOrder.code}</span></p>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-neutral-500">{t("orders.paymentMethod")}: </span>
          <span className="font-medium">{t("payment." + doneOrder.method)}</span>
          <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">{statusLabel("Chờ thanh toán", lang)}</span>
        </p>
        <p className="mt-4 text-sm leading-relaxed text-neutral-500">{t("checkout.donePendingNote")}</p>
      </div>
      <Link href="/account/orders" className="mt-8 inline-block bg-[#23232c] px-8 py-3.5 text-sm tracking-[0.2em] text-white font-heading">{t("checkout.doneViewOrders")}</Link>
    </div>
  );
  return (<div className="container-x pt-12 pb-20 grid md:grid-cols-2 gap-12">
    <form onSubmit={async e=>{e.preventDefault(); if (busy) return; setBusy(true); setErr(""); const fd=new FormData(e.currentTarget); const orderId=newId("Fashion Store"); try { await pushOrder({ id:orderId, date:new Date().toISOString(), customer:{ name:String(fd.get("name")||""), phone:String(fd.get("phone")||""), email:String(fd.get("email")||"")||undefined, address:String(fd.get("address")||"") }, items:items.map(i=>({name:i.product.name,size:i.size,qty:i.qty,price:i.product.price})), total, payment:translate("vi", `payment.${method}`), status:isOnline?"Chờ thanh toán":"Chờ xác nhận" }); clear(); if (!isOnline) { setDoneOrder({ code: orderId, method }); return; } const res = await fetch(`/api/payments/${method}/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderCode: orderId }) }); const data = (await res.json()) as Record<string, any>; if (data.simulation) { router.push(`/checkout/test-pay?order=${encodeURIComponent(orderId)}&gateway=${method}`); return; } if (!res.ok) throw new Error(data.error || t("checkout.sessionError")); if (data.redirectUrl) { window.location.href = data.redirectUrl; return; } if (data.qrUrl) { router.push(`/checkout/pay?order=${encodeURIComponent(orderId)}`); return; } throw new Error(t("checkout.noPaymentLink")); } catch (e2: any) { setErr(e2?.message || t("checkout.orderFailed")); setBusy(false); }}} className="space-y-4">
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
        {showSimNote && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">{t("checkout.simNote")}</p>}
      </div>
      {err && <p className="bg-red-50 text-red-700 text-sm px-4 py-3">{err}</p>}
      <button disabled={busy} className="bg-[#23232c] text-white w-full py-4 tracking-widest text-sm font-heading disabled:opacity-60">{busy ? t("checkout.processing") : t("checkout.placeOrder")}</button>
    </form>
    <div>
      <h2 className="font-semibold tracking-widest">{t("checkout.orderTitle")}</h2>
      {items.length === 0 ? (
        <div className="mt-5 border border-dashed border-neutral-300 px-4 py-6 text-center">
          <p className="text-sm text-neutral-500">{t("cart.empty")}</p>
          <Link href="/shop" className="mt-4 inline-block bg-[#23232c] px-5 py-2.5 text-sm tracking-widest text-white font-heading">{t("shop.continueShopping")}</Link>
        </div>
      ) : (
        <div className="space-y-4 mt-5">{items.map((i, idx) => (
          <div key={idx} className="flex gap-3">
            {i.product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={i.product.image} alt={productName(i.product, lang)} className="h-20 w-16 shrink-0 bg-neutral-100 object-cover" />
            ) : (
              <div className="flex h-20 w-16 shrink-0 items-center justify-center bg-neutral-100 text-xs text-neutral-400">—</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{productName(i.product, lang)}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{i.size} · {i.qty} × {formatPrice(i.product.price)}</p>
            </div>
            <span className="shrink-0 text-sm font-medium">{formatPrice(i.product.price * i.qty)}</span>
          </div>
        ))}</div>
      )}
      {items.length > 0 && (
        <>
          <div className="mt-6 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">{t("checkout.subtotal")}</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">{t("checkout.shippingFee")}</span><span>{shippingFee === 0 ? t("checkout.freeShipping") : formatPrice(shippingFee)}</span></div>
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between font-semibold"><span>{t("cart.total")}</span><span>{formatPrice(total)}</span></div>
        </>
      )}
      {selQr && selQrColor && (
        <div className="rounded-xl border px-5 py-5 text-center mt-8" style={{ backgroundColor: selQrColor.bg, borderColor: selQrColor.border }}>
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
    </div>
  </div>);
}
