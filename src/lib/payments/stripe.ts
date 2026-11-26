import Stripe from "stripe";
import { getPaymentEnv } from "./env";

/* Stripe (thẻ quốc tế) — Checkout Sessions.
   - Tạo phiên: POST /v1/checkout/sessions (qua SDK stripe, dùng fetch từ
     v13 nên chạy được trên Edge Runtime), mode=payment, success_url /
     cancel_url kèm {CHECKOUT_SESSION_ID}, metadata.orderCode = mã đơn.
   - VND được Stripe hỗ trợ và là tiền zero-decimal: amount = đúng số tiền
     VND (250000 = 250.000₫), không nhân 100.
   - Webhook: Stripe ký header stripe-signature (t=<thời gian>,v1=<hmac>);
     xác thực bằng SDK constructEvent với STRIPE_WEBHOOK_SECRET, rồi xử lý
     event checkout.session.completed → đơn đã trả.
   Thẻ test: 4242 4242 4242 4242, ngày hết hạn bất kỳ trong tương lai,
   CVC bất kỳ 3 số. */

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getPaymentEnv("STRIPE_SECRET_KEY")!);
  }
  return stripeClient;
}

export async function createCheckoutSession(input: {
  orderCode: string;
  amountVnd: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string | null; sessionId: string }> {
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "vnd",
          product_data: { name: `Don hang ${input.orderCode} — Fashion Store` },
          unit_amount: input.amountVnd,
        },
        quantity: 1,
      },
    ],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { orderCode: input.orderCode },
  });
  return { url: session.url, sessionId: session.id };
}

export async function getCheckoutSession(sessionId: string) {
  return getStripe().checkout.sessions.retrieve(sessionId);
}

/* Xác thực webhook Stripe bằng SDK — dùng constructEventAsync (Web Crypto,
   chạy chắc chắn trên Edge Runtime) với STRIPE_WEBHOOK_SECRET. Ném lỗi nếu
   chữ ký sai hoặc thiếu secret. */
export async function verifyStripeWebhook(
  rawBody: string,
  signature: string,
): Promise<Stripe.Event> {
  const secret = getPaymentEnv("STRIPE_WEBHOOK_SECRET");
  if (!secret) throw new Error("Chua cau hinh STRIPE_WEBHOOK_SECRET");
  return getStripe().webhooks.constructEventAsync(rawBody, signature, secret);
}
