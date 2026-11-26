import { NextResponse } from "next/server";
import {
  getOrderForPayment,
  getPaymentForOrder,
  markOrderPaid,
} from "@/lib/payments/common";
import { getPaymentInfo } from "@/lib/payments/payos";
import { captureOrder, getOrder as getPaypalOrder } from "@/lib/payments/paypal";
import { getCheckoutSession } from "@/lib/payments/stripe";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Trang kết quả (/checkout/result) gọi sau khi khách quay lại từ cổng
   thanh toán. Route này hỏi LẠI cổng phía server (không tin tham số trên
   URL) rồi mới kết luận đơn đã trả hay chưa.
   POST {gateway, orderCode, sessionId?}
   - payos: GET /v2/payment-requests/{orderCode số} → status "PAID".
   - stripe: retrieve checkout session → payment_status "paid".
   - paypal: capture phía server (nếu đang APPROVED) → status COMPLETED.
   - sepay: không có redirect — trạng thái lấy từ CSDL (webhook đã cập
     nhật, trang QR tự poll /api/payments/status). */
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, any>;
  const gateway = String(body?.gateway ?? "");
  const orderCode = String(body?.orderCode ?? "").trim();
  const sessionId = String(body?.sessionId ?? "");
  if (!orderCode) {
    return NextResponse.json({ error: "Thiếu mã đơn hàng" }, { status: 400 });
  }
  const order = await getOrderForPayment(orderCode);
  if (!order) {
    return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ paid: true, status: "paid" });
  }
  const payment = await getPaymentForOrder(orderCode);
  if (payment?.status === "failed") {
    return NextResponse.json({ paid: false, status: "failed" });
  }
  if (payment?.status === "simulated") {
    return NextResponse.json({ paid: true, status: "simulated" });
  }
  try {
    if (gateway === "payos" && payment?.gatewayRef) {
      const info = await getPaymentInfo(Number(payment.gatewayRef));
      if (info.status === "PAID" && info.amount === order.total) {
        await markOrderPaid(orderCode, {
          gateway: "payos",
          gatewayRef: payment.gatewayRef,
          rawPayload: JSON.stringify(info.raw),
        });
        return NextResponse.json({ paid: true, status: "paid" });
      }
      return NextResponse.json({ paid: false, status: info.status });
    }
    if (gateway === "stripe" && sessionId) {
      const session = await getCheckoutSession(sessionId);
      if (session.payment_status === "paid") {
        await markOrderPaid(orderCode, {
          gateway: "stripe",
          gatewayRef: session.id,
        });
        return NextResponse.json({ paid: true, status: "paid" });
      }
      return NextResponse.json({ paid: false, status: session.payment_status });
    }
    if (gateway === "paypal" && payment?.gatewayRef) {
      const current = await getPaypalOrder(payment.gatewayRef);
      if (current.status === "COMPLETED") {
        await markOrderPaid(orderCode, {
          gateway: "paypal",
          gatewayRef: payment.gatewayRef,
        });
        return NextResponse.json({ paid: true, status: "paid" });
      }
      if (current.status === "APPROVED") {
        const captured = await captureOrder(payment.gatewayRef);
        if (captured.status === "COMPLETED") {
          await markOrderPaid(orderCode, {
            gateway: "paypal",
            gatewayRef: payment.gatewayRef,
          });
          return NextResponse.json({ paid: true, status: "paid" });
        }
      }
      return NextResponse.json({ paid: false, status: current.status });
    }
  } catch (e: any) {
    return NextResponse.json(
      { paid: false, status: "pending", message: e?.message ?? "Chưa xác nhận được" },
      { status: 200 },
    );
  }
  return NextResponse.json({ paid: false, status: "pending" });
}
