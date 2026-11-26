import { NextResponse } from "next/server";
import {
  getOrderForPayment,
  getPaymentForOrder,
  recordPaymentPending,
} from "@/lib/payments/common";
import { isSimulationMode } from "@/lib/payments/config";
import { getSiteOrigin } from "@/lib/payments/env";
import { createPaymentLink } from "@/lib/payments/payos";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Tạo link thanh toán PayOS cho một đơn đang "Chờ thanh toán".
   Lũy đẳng: gọi lại cho cùng đơn sẽ trả lại link đã tạo trước đó. */
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
  if (isSimulationMode("payos")) {
    return NextResponse.json({ simulation: true });
  }
  const existing = await getPaymentForOrder(orderCode);
  if (
    existing?.gateway === "payos" &&
    existing.status === "pending" &&
    existing.rawPayload
  ) {
    try {
      const raw = JSON.parse(existing.rawPayload) as Record<string, any>;
      if (raw.checkoutUrl) {
        return NextResponse.json({
          redirectUrl: raw.checkoutUrl,
          qrCode: raw.qrCode ?? null,
          orderCode,
        });
      }
    } catch {}
  }
  const origin = getSiteOrigin(req);
  const returnUrl = `${origin}/checkout/result?gateway=payos&order=${encodeURIComponent(orderCode)}`;
  const cancelUrl = `${origin}/checkout/result?gateway=payos&order=${encodeURIComponent(orderCode)}&cancelled=1`;
  try {
    const link = await createPaymentLink({
      orderCode: order.id,
      amount: order.total,
      description: ("Don " + orderCode).slice(0, 25),
      returnUrl,
      cancelUrl,
    });
    await recordPaymentPending({
      orderCode,
      gateway: "payos",
      gatewayRef: String(link.orderCode),
      amount: order.total,
      currency: "VND",
      rawPayload: JSON.stringify(link),
    });
    return NextResponse.json({
      redirectUrl: link.checkoutUrl,
      qrCode: link.qrCode,
      orderCode,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "PayOS lỗi" },
      { status: 502 },
    );
  }
}
