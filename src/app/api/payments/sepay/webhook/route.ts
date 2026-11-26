import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getOrderForPayment,
  markOrderPaid,
} from "@/lib/payments/common";
import {
  checkWebhookAuth,
  extractOrderContent,
} from "@/lib/payments/sepay";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Webhook SePay: SePay POST khi có tiền vào tài khoản ngân hàng của shop.
   1. Xác thực header Authorization: Apikey <SEPAY_API_KEY>.
   2. Chỉ xử lý tiền vào (transferType === "in").
   3. Đối chiếu code/content với mã đơn (gatewayRef), kiểm tra số tiền
      chuyển >= tổng đơn, rồi đánh dấu đã trả (lũy đẳng — webhook trùng
      hoặc chuyển thừa đều chỉ tính 1 lần). */
export async function POST(req: Request) {
  if (!checkWebhookAuth(req)) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 401 });
  }
  let body: Record<string, any>;
  try {
    body = (await req.json()) as Record<string, any>;
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }
  if (body.transferType && body.transferType !== "in") {
    return NextResponse.json({ success: true });
  }
  const content = extractOrderContent(body as any);
  if (!content) return NextResponse.json({ success: true });
  const payment = await prisma.payment.findFirst({
    where: { gateway: "sepay", gatewayRef: content },
  });
  if (!payment) return NextResponse.json({ success: true });
  const order = await getOrderForPayment(payment.orderCode);
  if (!order) return NextResponse.json({ success: true });
  const amount = Number(body.transferAmount ?? 0);
  if (amount < order.total) {
    /* Chuyển chưa đủ tiền — chưa đánh dấu, chờ khách chuyển thêm. */
    return NextResponse.json({ success: true });
  }
  await markOrderPaid(payment.orderCode, {
    gateway: "sepay",
    gatewayRef: content,
    rawPayload: JSON.stringify(body),
  });
  return NextResponse.json({ success: true });
}
