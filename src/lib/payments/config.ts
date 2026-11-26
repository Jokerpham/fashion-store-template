import { getPaymentEnv } from "./env";

export type GatewayId = "payos" | "sepay" | "paypal" | "stripe";

/* Thông tin hiển thị của từng cổng (dùng ở trang checkout). */
export const GATEWAY_META: Record<
  GatewayId,
  { label: string; hint: string; currency: string }
> = {
  payos: {
    label: "PayOS — VietQR / ATM / ví",
    hint: "Quét VietQR, chuyển khoản ngân hàng, thẻ ATM nội địa, ví điện tử",
    currency: "VND",
  },
  sepay: {
    label: "SePay — VietQR chuyển khoản",
    hint: "Quét mã VietQR chuyển khoản vào tài khoản ngân hàng của shop",
    currency: "VND",
  },
  paypal: {
    label: "PayPal (USD)",
    hint: "Thanh toán bằng tài khoản PayPal hoặc thẻ quốc tế, tính bằng USD",
    currency: "USD",
  },
  stripe: {
    label: "Stripe — Thẻ quốc tế",
    hint: "Thẻ Visa / Mastercard / Amex, tính bằng VND",
    currency: "VND",
  },
};

/* Bật chế độ giả lập cho TOÀN BỘ cổng online: khách bấm thanh toán sẽ
   sang trang thử nghiệm, bấm "thành công" là đơn được đánh dấu đã trả mà
   không trừ tiền thật. */
export function isSimulationFlag(): boolean {
  return getPaymentEnv("PAYMENTS_SIMULATION") === "true";
}

export function isPayosConfigured(): boolean {
  return !!(
    getPaymentEnv("PAYOS_CLIENT_ID") &&
    getPaymentEnv("PAYOS_API_KEY") &&
    getPaymentEnv("PAYOS_CHECKSUM_KEY")
  );
}
export function isSepayConfigured(): boolean {
  return !!(
    getPaymentEnv("SEPAY_ACCOUNT_NUMBER") && getPaymentEnv("SEPAY_BANK_CODE")
  );
}
export function isPaypalConfigured(): boolean {
  return !!(
    getPaymentEnv("PAYPAL_CLIENT_ID") && getPaymentEnv("PAYPAL_CLIENT_SECRET")
  );
}
export function isStripeConfigured(): boolean {
  return !!getPaymentEnv("STRIPE_SECRET_KEY");
}

export function isGatewayConfigured(gateway: GatewayId): boolean {
  if (gateway === "payos") return isPayosConfigured();
  if (gateway === "sepay") return isSepayConfigured();
  if (gateway === "paypal") return isPaypalConfigured();
  return isStripeConfigured();
}

/* Chế độ giả lập bật khi: cờ PAYMENTS_SIMULATION=true, hoặc cổng đó chưa
   được cấu hình key. Nhờ vậy shop chạy thử được ngay cả khi chưa đăng ký
   tài khoản sandbox nào. */
export function isSimulationMode(gateway?: GatewayId): boolean {
  if (isSimulationFlag()) return true;
  if (!gateway) return true;
  return !isGatewayConfigured(gateway);
}

/* Tỉ giá quy đổi VND → USD cho PayPal (PayPal không hỗ trợ VND). Đặt
   PAYPAL_VND_PER_USD trong env để chỉnh, mặc định 26.000. */
export function getPaypalRate(): number {
  const raw = Number(getPaymentEnv("PAYPAL_VND_PER_USD") ?? "");
  return Number.isFinite(raw) && raw > 0 ? raw : 26000;
}
export function vndToUsd(vnd: number): number {
  return Math.round((vnd / getPaypalRate()) * 100) / 100;
}
