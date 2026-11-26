import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/payments/common";
import { getOrder } from "@/lib/payments/paypal";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Webhook PayPal: khi PayPal báo CHECKOUT.ORDER.COMPLETED, đọc lại đơn
   từ PayPal phía server và chỉ đánh dấu đã trả khi status thật sự là
   COMPLETED — không tin trạng thái trong payload webhook. */
export async function POST(req: Request) {
  let body: Record<string, any>;
  try {
    body = (await req.json()) as Record<string, any>;
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }
  const paypalOrderId = String(body?.resource?.id ?? "");
  if (!paypalOrderId) return NextResponse.json({ success: true });
  const payment = await prisma.payment.findFirst({
    where: { gateway: "paypal", gatewayRef: paypalOrderId },
  });
  if (!payment) return NextResponse.json({ success: true });
  try {
    const order = await getOrder(paypalOrderId);
    if (order.status === "COMPLETED") {
      await markOrderPaid(payment.orderCode, {
        gateway: "paypal",
        gatewayRef: paypalOrderId,
        rawPayload: JSON.stringify(body),
      });
    }
  } catch {
    /* PayPal lỗi tạm thời — trả 200 để PayPal thử gửi lại sau. */
  }
  return NextResponse.json({ success: true });
}
