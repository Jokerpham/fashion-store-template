import { getPaymentEnv } from "./env";

/* PayOS (VND) — dùng fetch thuần + Web Crypto HMAC, không dùng SDK để
   chạy được trên Edge Runtime. Tài liệu: https://payos.vn/docs
   - Tạo link: POST /v2/payment-requests, header x-client-id / x-api-key,
     chữ ký HMAC-SHA256(checksumKey) trên chuỗi key=value xếp theo ABC:
     amount, cancelUrl, description, orderCode, returnUrl.
   - orderCode của PayOS phải là SỐ: dùng id số của đơn trong CSDL (không
     phải mã đơn dạng chữ "Fashion Store...").
   - Webhook: PayOS POST về /api/payments/payos/webhook với
     {code, desc, data: {...}, signature}; signature là HMAC-SHA256 trên
     các trường của data (trừ signature) xếp theo ABC. data.code === "00"
     nghĩa là đã thanh toán thành công.
   - Kiểm tra lại: GET /v2/payment-requests/{orderCode} → data.status
     "PAID" / "PENDING" / "CANCELLED". */

const API_BASE = "https://api-merchant.payos.vn";

async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* So sánh chuỗi theo thời gian cố định để chống tấn công đo thời gian. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function sortedQuery(obj: Record<string, string | number>): string {
  return Object.keys(obj)
    .sort()
    .map((k) => `${k}=${obj[k]}`)
    .join("&");
}

export type PayosLink = {
  checkoutUrl: string;
  qrCode: string;
  orderCode: number;
  paymentLinkId: string;
};

export async function createPaymentLink(input: {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<PayosLink> {
  const clientId = getPaymentEnv("PAYOS_CLIENT_ID")!;
  const apiKey = getPaymentEnv("PAYOS_API_KEY")!;
  const checksumKey = getPaymentEnv("PAYOS_CHECKSUM_KEY")!;
  const signature = await hmacSha256Hex(
    checksumKey,
    sortedQuery({
      amount: input.amount,
      cancelUrl: input.cancelUrl,
      description: input.description,
      orderCode: input.orderCode,
      returnUrl: input.returnUrl,
    }),
  );
  const res = await fetch(`${API_BASE}/v2/payment-requests`, {
    method: "POST",
    headers: {
      "x-client-id": clientId,
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...input, signature }),
  });
  const json = (await res.json()) as Record<string, any>;
  if (!res.ok || json.code !== "00") {
    throw new Error(json.desc || `PayOS lỗi (${res.status})`);
  }
  return {
    checkoutUrl: json.data.checkoutUrl,
    qrCode: json.data.qrCode,
    orderCode: json.data.orderCode,
    paymentLinkId: json.data.paymentLinkId,
  };
}

/* Kiểm tra chữ ký webhook PayOS: HMAC-SHA256(checksumKey) trên các
   trường của data (trừ signature) xếp theo ABC, dạng key=value nối bằng &. */
export async function verifyWebhookSignature(
  data: Record<string, any>,
  signature: string,
): Promise<boolean> {
  const checksumKey = getPaymentEnv("PAYOS_CHECKSUM_KEY");
  if (!checksumKey || !signature) return false;
  const { signature: _ignored, ...rest } = data;
  const expected = await hmacSha256Hex(
    checksumKey,
    sortedQuery(rest as Record<string, string | number>),
  );
  return timingSafeEqual(expected, signature);
}

export async function getPaymentInfo(orderCode: number): Promise<{
  status: string;
  amount: number;
  raw: Record<string, any>;
}> {
  const clientId = getPaymentEnv("PAYOS_CLIENT_ID")!;
  const apiKey = getPaymentEnv("PAYOS_API_KEY")!;
  const res = await fetch(`${API_BASE}/v2/payment-requests/${orderCode}`, {
    headers: { "x-client-id": clientId, "x-api-key": apiKey },
  });
  const json = (await res.json()) as Record<string, any>;
  if (!res.ok || json.code !== "00") {
    throw new Error(json.desc || `PayOS lỗi (${res.status})`);
  }
  return { status: json.data.status, amount: json.data.amount, raw: json.data };
}
