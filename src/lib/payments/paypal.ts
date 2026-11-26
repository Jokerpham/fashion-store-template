import { getPaymentEnv } from "./env";

/* PayPal (quốc tế, USD) — Orders v2 REST.
   - Token OAuth2: POST /v1/oauth2/token (Basic client_id:secret), hạn ~9h,
     cache trong tiến trình.
   - Tạo đơn: POST /v2/checkout/orders (intent CAPTURE) → link approve cho
     khách bấm sang PayPal.
   - Sau khi khách quay lại: CAPTURE phía server (POST
     /v2/checkout/orders/{id}/capture) — không bao giờ tin redirect.
   - VND KHÔNG phải tiền tệ của PayPal: đơn tạo bằng USD, quy đổi từ VND
     theo PAYPAL_VND_PER_USD (mặc định 26.000), hiện số USD cho khách xem.
   Sandbox: https://api-m.sandbox.paypal.com (PAYPAL_ENV=sandbox);
   live: https://api-m.paypal.com (PAYPAL_ENV=live). */

function baseUrl(): string {
  return getPaymentEnv("PAYPAL_ENV") === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const id = getPaymentEnv("PAYPAL_CLIENT_ID")!;
  const secret = getPaymentEnv("PAYPAL_CLIENT_SECRET")!;
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const json = (await res.json()) as Record<string, any>;
  if (!res.ok) {
    throw new Error(json.error_description || `PayPal token lỗi (${res.status})`);
  }
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (Number(json.expires_in) || 32400) * 1000,
  };
  return json.access_token;
}

export async function createOrder(input: {
  usdAmount: number;
  orderCode: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approvalUrl: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.orderCode.replace(/\s+/g, "-"),
          amount: {
            currency_code: "USD",
            value: input.usdAmount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        brand_name: "Fashion Store",
        user_action: "PAY_NOW",
      },
    }),
  });
  const json = (await res.json()) as Record<string, any>;
  if (!res.ok) {
    throw new Error(json.message || `PayPal tạo đơn lỗi (${res.status})`);
  }
  const approval = (json.links ?? []).find((l: any) => l.rel === "approve");
  return { id: json.id, approvalUrl: approval?.href ?? "" };
}

export async function getOrder(id: string): Promise<Record<string, any>> {
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl()}/v2/checkout/orders/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as Record<string, any>;
  if (!res.ok) {
    throw new Error(json.message || `PayPal lỗi (${res.status})`);
  }
  return json;
}

/* Thu tiền sau khi khách phê duyệt. Nếu đơn đã capture rồi, PayPal trả
   422 ORDER_ALREADY_CAPTURED — khi đó đọc lại đơn để lấy trạng thái thật. */
export async function captureOrder(id: string): Promise<Record<string, any>> {
  const token = await getAccessToken();
  const res = await fetch(
    `${baseUrl()}/v2/checkout/orders/${encodeURIComponent(id)}/capture`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}",
    },
  );
  const json = (await res.json()) as Record<string, any>;
  if (!res.ok) {
    if (
      res.status === 422 &&
      JSON.stringify(json).includes("ORDER_ALREADY_CAPTURED")
    ) {
      return getOrder(id);
    }
    throw new Error(json.message || `PayPal capture lỗi (${res.status})`);
  }
  return json;
}
