import { NextResponse } from "next/server";
import {
  getOrderForPayment,
  getPaymentForOrder,
  recordPaymentPending,
} from "@/lib/payments/common";
import { isSimulationMode } from "@/lib/payments/config";
import {
  buildVietQrUrl,
  getSepayBankInfo,
  toPaymentContent,
} from "@/lib/payments/sepay";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Tạo mã VietQR SePay cho một đơn đang "Chờ thanh toán". Trả về link ảnh
   QR + thông tin tài khoản để trang /checkout/pay hiển thị. Lũy đẳng: gọi
   lại cho cùng đơn trả lại QR đã tạo trước đó. */
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
  if (isSimulationMode("sepay")) {
    return NextResponse.json({ simulation: true });
  }
  const existing = await getPaymentForOrder(orderCode);
  if (
    existing?.gateway === "sepay" &&
    existing.status === "pending" &&
    existing.rawPayload
  ) {
    try {
      const raw = JSON.parse(existing.rawPayload) as Record<string, any>;
      if (raw.qrUrl) {
        return NextResponse.json({ ...raw, orderCode });
      }
    } catch {}
  }
  const bank = getSepayBankInfo();
  const content = toPaymentContent(orderCode);
  const payload = {
    qrUrl: buildVietQrUrl({
      bank: bank.bank,
      accountNumber: bank.accountNumber,
      amount: order.total,
      content,
    }),
    bank: bank.bank,
    accountNumber: bank.accountNumber,
    accountName: bank.accountName,
    content,
    amount: order.total,
  };
  await recordPaymentPending({
    orderCode,
    gateway: "sepay",
    gatewayRef: content,
    amount: order.total,
    currency: "VND",
    rawPayload: JSON.stringify(payload),
  });
  return NextResponse.json({ ...payload, orderCode });
}
