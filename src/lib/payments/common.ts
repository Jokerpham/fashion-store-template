import { prisma } from "@/lib/prisma";
import {
  getAdminEmail,
  scheduleEmail,
  sendPaymentReceivedEmail,
} from "@/lib/email";
import { toAppOrder } from "@/lib/db-map";
import type { GatewayId } from "./config";

/* Hàm dùng chung cho các cổng thanh toán (chỉ chạy phía server).
   QUAN TRỌNG: tổng tiền luôn lấy từ đơn hàng trong CSDL, không bao giờ tin
   số tiền khách gửi lên từ trình duyệt. */

/* Đơn hàng kèm món hàng, dùng để đối chiếu số tiền trước khi tạo phiên
   thanh toán và khi webhook báo đã trả. */
export async function getOrderForPayment(orderCode: string) {
  return prisma.order.findUnique({
    where: { code: orderCode },
    include: { items: true },
  });
}

export async function getPaymentForOrder(orderCode: string) {
  return prisma.payment.findUnique({ where: { orderCode } });
}

/* Ghi (hoặc cập nhật) bản ghi thanh toán ở trạng thái chờ. Gọi lại create
   cho cùng đơn sẽ không tạo phiên mới mà trả lại phiên cũ (xem các route
   create) — nhờ rawPayload lưu link/QR đã tạo. */
export async function recordPaymentPending(data: {
  orderCode: string;
  gateway: GatewayId;
  gatewayRef?: string;
  amount: number;
  currency: string;
  rawPayload?: string;
}) {
  return prisma.payment.upsert({
    where: { orderCode: data.orderCode },
    create: {
      orderCode: data.orderCode,
      gateway: data.gateway,
      gatewayRef: data.gatewayRef ?? null,
      amount: data.amount,
      currency: data.currency,
      status: "pending",
      rawPayload: data.rawPayload ?? null,
    },
    update: {
      gateway: data.gateway,
      gatewayRef: data.gatewayRef ?? undefined,
      amount: data.amount,
      currency: data.currency,
      status: "pending",
      rawPayload: data.rawPayload ?? undefined,
    },
  });
}

/* Đánh dấu đơn đã thanh toán. Lũy đẳng (idempotent): dùng updateMany có
   điều kiện status != "paid" nên webhook gọi 2 lần, hoặc webhook và trang
   kết quả cùng xác nhận, cũng chỉ tính 1 lần — đơn đã paid thì bỏ qua. */
export async function markOrderPaid(
  orderCode: string,
  opts: {
    gateway: GatewayId;
    gatewayRef?: string;
    amount?: number;
    currency?: string;
    rawPayload?: string;
    simulated?: boolean;
  },
): Promise<{ ok: boolean; alreadyPaid?: boolean; reason?: string }> {
  const updated = await prisma.order.updateMany({
    where: { code: orderCode, status: { not: "paid" } },
    data: { status: "paid" },
  });
  if (updated.count === 0) {
    const existing = await prisma.order.findUnique({
      where: { code: orderCode },
    });
    if (existing?.status === "paid") return { ok: true, alreadyPaid: true };
    return { ok: false, reason: "not_found" };
  }
  const order = await prisma.order.findUnique({ where: { code: orderCode } });
  await prisma.payment.upsert({
    where: { orderCode },
    create: {
      orderCode,
      gateway: opts.gateway,
      gatewayRef: opts.gatewayRef ?? null,
      amount: opts.amount ?? order?.total ?? 0,
      currency: opts.currency ?? "VND",
      status: opts.simulated ? "simulated" : "paid",
      rawPayload: opts.rawPayload ?? null,
    },
    update: {
      gateway: opts.gateway,
      gatewayRef: opts.gatewayRef ?? undefined,
      status: opts.simulated ? "simulated" : "paid",
      rawPayload: opts.rawPayload ?? undefined,
    },
  });
  /* Email báo admin đã nhận thanh toán (v6): chỉ gửi đúng 1 lần cho lần
     chuyển sang paid đầu tiên — nhờ điều kiện status != "paid" ở trên,
     webhook gọi lại hay trang kết quả xác nhận thêm cũng không gửi trùng.
     Thanh toán giả lập vẫn gửi nhưng ghi rõ "(giả lập)" để admin không
     nhầm là tiền thật. Lỗi mail không bao giờ làm hỏng xác nhận thanh toán. */
  const full = await prisma.order.findUnique({
    where: { code: orderCode },
    include: { items: true },
  });
  if (full) {
    scheduleEmail(
      getAdminEmail(prisma).then((adminEmail) =>
        sendPaymentReceivedEmail(toAppOrder(full), opts.gateway, adminEmail, {
          simulated: opts.simulated,
          amount: opts.amount ?? full.total,
          currency: opts.currency ?? "VND",
        }),
      ),
    );
  }
  return { ok: true, alreadyPaid: false };
}

/* Đánh dấu thanh toán thất bại (vd giả lập thất bại). Đơn hàng giữ nguyên
   trạng thái chờ thanh toán để khách thử lại. */
export async function markPaymentFailed(
  orderCode: string,
  gateway: GatewayId,
  reason?: string,
) {
  await prisma.payment.upsert({
    where: { orderCode },
    create: {
      orderCode,
      gateway,
      amount: 0,
      currency: "VND",
      status: "failed",
      rawPayload: reason ?? null,
    },
    update: { status: "failed", rawPayload: reason ?? undefined },
  });
}
