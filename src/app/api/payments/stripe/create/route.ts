import { NextResponse } from "next/server";
import {
  getOrderForPayment,
  getPaymentForOrder,
  recordPaymentPending,
} from "@/lib/payments/common";
import { isSimulationMode } from "@/lib/payments/config";
import { getSiteOrigin } from "@/lib/payments/env";
import { createCheckoutSession } from "@/lib/payments/stripe";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Tạo Stripe Checkout Session cho một đơn đang "Chờ thanh toán". Lũy
   đẳng: gọi lại cho cùng đơn trả lại link checkout đã tạo trước đó. */
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
  if (isSimulationMode("stripe")) {
    return NextResponse.json({ simulation: true });
  }
  const existing = await getPaymentForOrder(orderCode);
  if (
    existing?.gateway === "stripe" &&
    existing.status === "pending" &&
    existing.rawPayload
  ) {
    try {
      const raw = JSON.parse(existing.rawPayload) as Record<string, any>;
      if (raw.url) {
        return NextResponse.json({ redirectUrl: raw.url, orderCode });
      }
    } catch {}
  }
  const origin = getSiteOrigin(req);
  const successUrl = `${origin}/checkout/result?gateway=stripe&order=${encodeURIComponent(orderCode)}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/checkout/result?gateway=stripe&order=${encodeURIComponent(orderCode)}&cancelled=1`;
  try {
    const session = await createCheckoutSession({
      orderCode,
      amountVnd: order.total,
      successUrl,
      cancelUrl,
    });
    await recordPaymentPending({
      orderCode,
      gateway: "stripe",
      gatewayRef: session.sessionId,
      amount: order.total,
      currency: "VND",
      rawPayload: JSON.stringify(session),
    });
    return NextResponse.json({ redirectUrl: session.url, orderCode });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Stripe lỗi" },
      { status: 502 },
    );
  }
}
