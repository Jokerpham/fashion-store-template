import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/payments/common";
import { verifyStripeWebhook } from "@/lib/payments/stripe";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Webhook Stripe: xác thực chữ ký stripe-signature bằng SDK (Web Crypto),
   rồi xử lý event checkout.session.completed — chỉ khi
   session.payment_status === "paid" mới đánh dấu đơn đã trả (lũy đẳng). */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  let event: any;
  try {
    event = await verifyStripeWebhook(rawBody, signature);
  } catch {
    return NextResponse.json(
      { error: "Chữ ký không hợp lệ" },
      { status: 400 },
    );
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Record<string, any>;
    const orderCode = String(session?.metadata?.orderCode ?? "");
    if (orderCode && session.payment_status === "paid") {
      await markOrderPaid(orderCode, {
        gateway: "stripe",
        gatewayRef: String(session.id ?? ""),
        rawPayload: JSON.stringify(event),
      });
    }
  }
  return NextResponse.json({ received: true });
}
