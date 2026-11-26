import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getOrderForPayment,
  markOrderPaid,
} from "@/lib/payments/common";
import { verifyWebhookSignature } from "@/lib/payments/payos";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Webhook PayOS: POST {code, desc, data: {...}, signature}.
   1. Kiểm tra chữ ký HMAC-SHA256 trên data.
   2. Chỉ khi data.code === "00" (đã trả) mới xử lý.
   3. Tìm đơn qua gatewayRef (= orderCode số của PayOS = id số của đơn),
      kiểm tra số tiền khớp tổng đơn, rồi đánh dấu đã trả (lũy đẳng). */
export async function POST(req: Request) {
  let body: Record<string, any>;
  try {
    body = (await req.json()) as Record<string, any>;
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }
  const data = (body?.data ?? {}) as Record<string, any>;
  const signature = String(body?.signature ?? "");
  let valid = false;
  try {
    valid = await verifyWebhookSignature(data, signature);
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json(
      { error: "Chữ ký không hợp lệ" },
      { status: 401 },
    );
  }
  if (data.code === "00" && data.orderCode !== undefined) {
    const payment = await prisma.payment.findFirst({
      where: { gateway: "payos", gatewayRef: String(data.orderCode) },
    });
    if (payment) {
      const order = await getOrderForPayment(payment.orderCode);
      if (order && Number(data.amount) === order.total) {
        await markOrderPaid(payment.orderCode, {
          gateway: "payos",
          gatewayRef: String(data.orderCode),
          rawPayload: JSON.stringify(body),
        });
      }
    }
  }
  return NextResponse.json({ success: true });
}
