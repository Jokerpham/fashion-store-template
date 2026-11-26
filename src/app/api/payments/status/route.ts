import { NextResponse } from "next/server";
import { toAppStatus } from "@/lib/db-map";
import {
  getOrderForPayment,
  getPaymentForOrder,
} from "@/lib/payments/common";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Trang QR SePay gọi mỗi 5 giây để biết khách đã chuyển khoản chưa.
   GET /api/payments/status?order=<mã đơn> */
export async function GET(req: Request) {
  const orderCode = new URL(req.url).searchParams.get("order") ?? "";
  if (!orderCode) {
    return NextResponse.json({ error: "Thiếu mã đơn hàng" }, { status: 400 });
  }
  const order = await getOrderForPayment(orderCode);
  if (!order) {
    return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });
  }
  const payment = await getPaymentForOrder(orderCode);
  return NextResponse.json({
    orderCode,
    status: toAppStatus(order.status),
    dbStatus: order.status,
    paymentStatus: payment?.status ?? null,
    gateway: payment?.gateway ?? order.paymentMethod,
    total: order.total,
  });
}
