import { NextResponse } from "next/server";
import {
  getOrderForPayment,
  getPaymentForOrder,
  markOrderPaid,
} from "@/lib/payments/common";
import { getPaymentInfo } from "@/lib/payments/payos";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Trang kết quả (/checkout/result) gọi sau khi khách quay lại từ cổng
   thanh toán. Route này hỏi LẠI cổng phía server (không tin tham số trên
   URL) rồi mới kết luận đơn đã trả hay chưa.
   POST {gateway, orderCode}
   - payos: GET /v2/payment-requests/{orderCode số} → status "PAID".
   - sepay: không có redirect — trạng thái lấy từ CSDL (webhook đã cập
     nhật, trang QR tự poll /api/payments/status). */
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, any>;
  const gateway = String(body?.gateway ?? "");
  const orderCode = String(body?.orderCode ?? "").trim();
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
  } catch (e: any) {
    return NextResponse.json(
      { paid: false, status: "pending", message: e?.message ?? "Chưa xác nhận được" },
      { status: 200 },
    );
  }
  return NextResponse.json({ paid: false, status: "pending" });
}
