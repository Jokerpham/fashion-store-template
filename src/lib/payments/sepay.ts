import { getPaymentEnv } from "./env";

/* SePay (VND, VietQR) — KHÔNG có API "tạo thanh toán". Shop chỉ cần:
   1. Tạo mã VietQR cho khách quét: https://qr.sepay.vn/img?acc=...&bank=...
      &amount=...&des=<nội dung chuyển khoản> (nội dung = mã đơn đã chuẩn
      hóa, xem toPaymentContent).
   2. SePay theo dõi tài khoản ngân hàng của shop; khi tiền vào, SePay
      POST webhook về /api/payments/sepay/webhook với header
      Authorization: Apikey <SEPAY_API_KEY> và payload:
      {id, gateway, transactionDate, accountNumber, code, content,
       transferType: "in", transferAmount, referenceCode, description}.
      Shop đối chiếu code/content với mã đơn, kiểm tra số tiền, rồi mới
      đánh dấu đã thanh toán. Trùng webhook thì bỏ qua (đơn đã paid).
   Tài liệu: https://developer.sepay.vn/en/sepay-webhooks/tao-qr-va-form-thanh-toan */

export function toPaymentContent(orderCode: string): string {
  /* Nội dung chuyển khoản: chỉ chữ + số, viết hoa, bỏ khoảng trắng và ký
     tự đặc biệt — vì ngân hàng có thể lược bỏ chúng khi trả webhook, nên
     hai phía phải chuẩn hóa giống nhau mới đối chiếu được. */
  return orderCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function buildVietQrUrl(input: {
  bank: string;
  accountNumber: string;
  amount: number;
  content: string;
}): string {
  const params = new URLSearchParams({
    acc: input.accountNumber,
    bank: input.bank,
    amount: String(input.amount),
    des: input.content,
  });
  return `https://qr.sepay.vn/img?${params.toString()}`;
}

export function getSepayBankInfo(): {
  bank: string;
  accountNumber: string;
  accountName: string;
} {
  return {
    bank: getPaymentEnv("SEPAY_BANK_CODE") ?? "",
    accountNumber: getPaymentEnv("SEPAY_ACCOUNT_NUMBER") ?? "",
    accountName: getPaymentEnv("SEPAY_ACCOUNT_NAME") ?? "",
  };
}

/* Webhook SePay xác thực bằng header Authorization: Apikey <key> — so
   sánh cố định thời gian, không dùng == trực tiếp. */
export function checkWebhookAuth(req: Request): boolean {
  const key = getPaymentEnv("SEPAY_API_KEY");
  if (!key) return false;
  const header = req.headers.get("authorization") ?? "";
  if (header.length !== `Apikey ${key}`.length) return false;
  let diff = 0;
  const expected = `Apikey ${key}`;
  for (let i = 0; i < expected.length; i++) {
    diff |= header.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export type SepayWebhook = {
  id: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  code?: string;
  content?: string;
  transferType?: string;
  transferAmount?: number;
  referenceCode?: string;
  description?: string;
};

/* Trích mã đơn đã chuẩn hóa từ webhook: thử code rồi content rồi
   description — trường nào có dạng FASHIONSTORE<...> thì lấy. */
export function extractOrderContent(payload: SepayWebhook): string | null {
  const candidates = [payload.code, payload.content, payload.description].filter(
    Boolean,
  ) as string[];
  for (const c of candidates) {
    const norm = c.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const m = norm.match(/FASHIONSTORE[A-Z0-9]+/);
    if (m) return m[0];
  }
  return null;
}
