import { NextResponse } from "next/server";
import {
  getOrderForPayment,
  getPaymentForOrder,
  recordPaymentPending,
} from "@/lib/payments/common";
import { isSimulationMode, vndToUsd } from "@/lib/payments/config";
import { getSiteOrigin } from "@/lib/payments/env";
import { createOrder } from "@/lib/payments/paypal";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Tạo đơn PayPal (USD) cho một đơn đang "Chờ thanh toán". Lũy đẳng: gọi
   lại cho cùng đơn trả lại link approve đã tạo trước đó. */
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, any>;
  const orderCode = String(body?.orderCode ?? "").trim();
  if (!orderCode) {
    return NextResponse.json({ error: "Thiếu mã đơn hàng" }, { status: 400 });
  }
  const order = await getOrderForPayment(orderCode);
  if (!order) {
    return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });
  }
  if (order.status !== "awaiting_payment") {
    return NextResponse.json(
      { error: "Đơn không ở trạng thái chờ thanh toán", status: order.status },
      { status: 409 },
    );
  }
  if (isSimulationMode("paypal")) {
    return NextResponse.json({ simulation: true });
  }
  const existing = await getPaymentForOrder(orderCode);
  if (
    existing?.gateway === "paypal" &&
    existing.status === "pending" &&
    existing.rawPayload
  ) {
    try {
      const raw = JSON.parse(existing.rawPayload) as Record<string, any>;
      if (raw.approvalUrl) {
        return NextResponse.json({
          redirectUrl: raw.approvalUrl,
          usdAmount: raw.usdAmount,
          orderCode,
        });
      }
    } catch {}
  }
  const origin = getSiteOrigin(req);
  const returnUrl = `${origin}/checkout/result?gateway=paypal&order=${encodeURIComponent(orderCode)}`;
  const cancelUrl = `${origin}/checkout/result?gateway=paypal&order=${encodeURIComponent(orderCode)}&cancelled=1`;
  const usdAmount = vndToUsd(order.total);
  try {
    const created = await createOrder({
      usdAmount,
      orderCode,
      returnUrl,
      cancelUrl,
    });
    await recordPaymentPending({
      orderCode,
      gateway: "paypal",
      gatewayRef: created.id,
      amount: Math.round(usdAmount * 100),
      currency: "USD",
      rawPayload: JSON.stringify({ id: created.id, approvalUrl: created.approvalUrl, usdAmount }),
    });
    return NextResponse.json({
      redirectUrl: created.approvalUrl,
      usdAmount,
      orderCode,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "PayPal lỗi" },
      { status: 502 },
    );
  }
}
