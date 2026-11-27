import { getPaymentEnv } from "./env";

export type GatewayId = "payos" | "sepay";

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

export function isGatewayConfigured(gateway: GatewayId): boolean {
  if (gateway === "payos") return isPayosConfigured();
  return isSepayConfigured();
}

/* Chế độ giả lập bật khi: cờ PAYMENTS_SIMULATION=true, hoặc cổng đó chưa
   được cấu hình key. Nhờ vậy shop chạy thử được ngay cả khi chưa đăng ký
   tài khoản sandbox nào. */
export function isSimulationMode(gateway?: GatewayId): boolean {
  if (isSimulationFlag()) return true;
  if (!gateway) return true;
  return !isGatewayConfigured(gateway);
}
