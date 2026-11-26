import { NextResponse } from "next/server";
import {
  getOrderForPayment,
  markOrderPaid,
  markPaymentFailed,
} from "@/lib/payments/common";
import { isSimulationMode } from "@/lib/payments/config";
import type { GatewayId } from "@/lib/payments/config";

export const dynamic = "force-dynamic";
export const runtime = "edge";

/* Giả lập kết quả thanh toán — CHỈ chạy khi đang ở chế độ giả lập
   (PAYMENTS_SIMULATION=true hoặc cổng đó chưa có key thật). Khi cổng đã
   có key thật, route này khóa lại (403) để không ai "giả vờ đã trả".
   POST {orderCode, result: "success" | "failed"} */
export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, any>;
  const orderCode = String(body?.orderCode ?? "").trim();
  const result = String(body?.result ?? "");
  if (!orderCode || (result !== "success" && result !== "failed")) {
    return NextResponse.json(
      { error: "Thiếu mã đơn hoặc kết quả không hợp lệ" },
      { status: 400 },
    );
  }
  const order = await getOrderForPayment(orderCode);
  if (!order) {
    return NextResponse.json({ error: "Không tìm thấy đơn" }, { status: 404 });
  }
  const gateway = order.paymentMethod as GatewayId;
  if (!["payos", "sepay", "paypal", "stripe"].includes(gateway)) {
    return NextResponse.json(
      { error: "Đơn này không dùng thanh toán online" },
      { status: 400 },
    );
  }
  if (!isSimulationMode(gateway)) {
    return NextResponse.json(
      {
        error:
          "Chế độ giả lập đang tắt — cổng này đã có key thật, hãy thanh toán thật.",
      },
      { status: 403 },
    );
  }
  if (result === "success") {
    await markOrderPaid(orderCode, {
      gateway,
      simulated: true,
      rawPayload: JSON.stringify({ simulated: true, result }),
    });
    return NextResponse.json({ ok: true, status: "paid", simulated: true });
  }
  await markPaymentFailed(orderCode, gateway, "simulated failure");
  return NextResponse.json({ ok: true, status: "failed", simulated: true });
}
