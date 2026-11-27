/* Gửi email giao dịch qua Resend (v6) — CHỈ chạy phía server.
   Dùng Resend HTTP API qua fetch thuần, KHÔNG dùng nodemailer/SMTP
   (SMTP không chạy được trên Cloudflare Edge Runtime) và không cần thêm
   dependency nào. Mọi hàm ở đây KHÔNG BAO GIỜ ném lỗi: chưa cấu hình key
   thì bỏ qua lặng lẽ (chỉ log), gửi lỗi thì log rồi thôi — email hỏng
   không bao giờ được làm hỏng đăng ký / đặt hàng / xác nhận thanh toán. */
import { getRequestContext } from "@cloudflare/next-on-pages";
import type { Order } from "@/lib/store";
import { paymentMethodKey } from "@/lib/i18n";

export function getEmailEnv(name: string): string | undefined {
  try {
    const env = getRequestContext().env as unknown as Record<
      string,
      string | undefined
    >;
    if (env && typeof env[name] === "string" && env[name]) return env[name];
  } catch {
    /* Ngoài Pages runtime (vd lúc build) getRequestContext ném lỗi. */
  }
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function isEmailConfigured(): boolean {
  return !!getEmailEnv("RESEND_API_KEY") && !!getEmailEnv("EMAIL_FROM");
}

function getFrom(): string {
  return (
    getEmailEnv("EMAIL_FROM") ?? "Fashion Store <onboarding@resend.dev>"
  );
}

function getSiteUrl(): string {
  return (getEmailEnv("NEXT_PUBLIC_SITE_URL") ?? "").replace(/\/$/, "");
}

/* Địa chỉ nhận email của admin: ưu tiên biến môi trường ADMIN_EMAIL,
   nếu không có thì lấy email tài khoản admin trong CSDL, cuối cùng mới
   rơi về admin@store.local (địa chỉ mẫu — nên đặt ADMIN_EMAIL thật). */
export async function getAdminEmail(
  prisma: {
    user: { findFirst: (args: any) => Promise<{ email: string } | null> };
  },
): Promise<string> {
  const fromEnv = getEmailEnv("ADMIN_EMAIL");
  if (fromEnv) return fromEnv;
  try {
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
      select: { email: true },
    });
    if (admin?.email) return admin.email;
  } catch {}
  return "admin@store.local";
}

/* Chạy một promise gửi mail ở chế độ nền: trên Cloudflare Pages dùng
   ctx.waitUntil để worker không bị ngắt giữa chừng; local thì promise
   vẫn chạy tiếp trong tiến trình dev. Promise đã được bọc catch nên
   không bao giờ ném lỗi ra ngoài. */
export function scheduleEmail(p: Promise<unknown>): void {
  const safe = p.catch(() => {});
  try {
    const ctx = (
      getRequestContext() as unknown as {
        ctx?: { waitUntil?: (p: Promise<unknown>) => void };
      }
    ).ctx;
    if (ctx?.waitUntil) {
      ctx.waitUntil(safe);
      return;
    }
  } catch {}
  void safe;
}

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; skipped?: boolean; error?: string };

/* Gửi 1 email qua Resend. Không cấu hình key thì bỏ qua lặng lẽ. */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const apiKey = getEmailEnv("RESEND_API_KEY");
  if (!apiKey) {
    console.log("[email] RESEND_API_KEY chưa cấu hình — bỏ qua gửi mail.");
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: getFrom(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[email] Resend lỗi", res.status, detail.slice(0, 300));
      return { ok: false, error: `Resend ${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    return { ok: true, id: typeof data.id === "string" ? data.id : undefined };
  } catch (e) {
    console.error("[email] Không gửi được mail:", e);
    return { ok: false, error: String(e) };
  }
}

/* ---------- Mẫu email song ngữ (VI + EN trong cùng 1 mail) ---------- */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number): string {
  return n.toLocaleString("en-US") + "₫";
}

const PAYMENT_EN: Record<string, string> = {
  cod: "COD — Cash on delivery",
  bank: "Bank transfer",
  momo: "MoMo / ZaloPay wallet",
  payos: "PayOS — VietQR / ATM / e-wallet",
  sepay: "SePay — VietQR bank transfer",
};

function paymentEn(label: string): string {
  return PAYMENT_EN[paymentMethodKey(label)] ?? label;
}

function orderItemsHtml(order: Order): string {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;">${esc(i.name)} (${esc(i.size)})</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${money(i.price * i.qty)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:2px solid #ddd;">Sản phẩm / Product</th><th style="padding:6px 8px;border-bottom:2px solid #ddd;">SL / Qty</th><th style="text-align:right;padding:6px 8px;border-bottom:2px solid #ddd;">Thành tiền / Amount</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function orderSummary(order: Order, lang: "vi" | "en"): string {
  if (lang === "vi") {
    return [
      `<p>Mã đơn: <b>${esc(order.id)}</b></p>`,
      `<p>Khách hàng: ${esc(order.customer.name)} — ${esc(order.customer.email ?? "")} — ${esc(order.customer.phone)}</p>`,
      `<p>Địa chỉ: ${esc(order.customer.address)}</p>`,
      orderItemsHtml(order),
      `<p>Tổng cộng: <b>${money(order.total)}</b></p>`,
      `<p>Thanh toán: ${esc(order.payment)}</p>`,
      `<p>Trạng thái: ${esc(order.status)}</p>`,
    ].join("\n");
  }
  return [
    `<p>Order code: <b>${esc(order.id)}</b></p>`,
    `<p>Customer: ${esc(order.customer.name)} — ${esc(order.customer.email ?? "")} — ${esc(order.customer.phone)}</p>`,
    `<p>Address: ${esc(order.customer.address)}</p>`,
    orderItemsHtml(order),
    `<p>Total: <b>${money(order.total)}</b></p>`,
    `<p>Payment: ${esc(paymentEn(order.payment))}</p>`,
    `<p>Status: ${esc(order.status === "Đã thanh toán" ? "Paid" : order.status === "Chờ thanh toán" ? "Awaiting payment" : order.status)}</p>`,
  ].join("\n");
}

function wrap(title: string, vi: string, en: string): string {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#222;line-height:1.6;max-width:600px;margin:0 auto;padding:16px;">
<h2 style="margin:0 0 12px;">${esc(title)}</h2>
<div>${vi}</div>
<hr style="border:none;border-top:1px solid #ddd;margin:20px 0;" />
<div>${en}</div>
<p style="color:#888;font-size:12px;margin-top:24px;">Fashion Store — Đây là email tự động, vui lòng không trả lời. / This is an automated email, please do not reply.</p>
</body></html>`;
}

/* 1) Email chào mừng khi khách đăng ký tài khoản thành công. */
export function sendWelcomeEmail(input: {
  name: string;
  email: string;
}): Promise<SendEmailResult> {
  const site = getSiteUrl();
  const shopLink = site
    ? `<p><a href="${esc(site)}">${esc(site)}</a></p>`
    : "";
  const vi = `<p>Xin chào <b>${esc(input.name)}</b>,</p><p>Tài khoản của bạn tại <b>Fashion Store</b> đã được tạo thành công. Bạn có thể đăng nhập để mua sắm, theo dõi đơn hàng và nhận ưu đãi mới nhất.</p>${shopLink}`;
  const en = `<p>Hello <b>${esc(input.name)}</b>,</p><p>Your <b>Fashion Store</b> account has been created successfully. You can now log in to shop, track your orders and receive our latest offers.</p>${shopLink}`;
  return sendEmail({
    to: input.email,
    subject: "Chào mừng bạn đến với Fashion Store! | Welcome to Fashion Store!",
    html: wrap("Fashion Store", vi, en),
  });
}

/* 2) Email báo admin khi có đơn hàng mới. */
export function sendNewOrderEmail(
  order: Order,
  adminEmail: string,
): Promise<SendEmailResult> {
  const vi = `<p>Có đơn hàng mới trên <b>Fashion Store</b>:</p>${orderSummary(order, "vi")}`;
  const en = `<p>A new order has been placed on <b>Fashion Store</b>:</p>${orderSummary(order, "en")}`;
  return sendEmail({
    to: adminEmail,
    subject: `[Fashion Store] Đơn hàng mới ${order.id} | New order ${order.id}`,
    html: wrap("Đơn hàng mới / New order", vi, en),
  });
}

/* 3) Email báo admin khi thanh toán online được xác nhận đã trả.
   simulated = true khi đây là thanh toán giả lập (chưa có key thật):
   ghi rõ trong tiêu đề và nội dung để admin không nhầm là tiền thật. */
export function sendPaymentReceivedEmail(
  order: Order,
  gateway: string,
  adminEmail: string,
  opts?: { simulated?: boolean; amount?: number; currency?: string },
): Promise<SendEmailResult> {
  const sim = opts?.simulated ? " (giả lập / simulated)" : "";
  const vi = `<p>Đơn hàng <b>${esc(order.id)}</b> đã được thanh toán qua <b>${esc(gateway)}</b>${opts?.simulated ? " (giả lập — không có tiền thật)" : ""}:</p>${orderSummary(order, "vi")}`;
  const en = `<p>Order <b>${esc(order.id)}</b> has been paid via <b>${esc(gateway)}</b>${opts?.simulated ? " (simulated — no real money)" : ""}:</p>${orderSummary(order, "en")}`;
  return sendEmail({
    to: adminEmail,
    subject: `[Fashion Store] Đã nhận thanh toán ${order.id}${sim} | Payment received ${order.id}${sim}`,
    html: wrap("Đã nhận thanh toán / Payment received", vi, en),
  });
}
