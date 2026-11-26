import { getRequestContext } from "@cloudflare/next-on-pages";

/* Đọc biến môi trường cho các cổng thanh toán.
   - Trên Cloudflare Pages: biến nằm trong env của worker, lấy qua
     getRequestContext().env (giống cách lấy binding DB trong prisma.ts).
   - Chạy local (`npm run dev`): lấy từ process.env (đọc từ .env.local).
   KHÔNG dùng NEXT_PUBLIC_* cho secret — secret chỉ ở phía server, không
   bao giờ lọt ra trình duyệt. */
export function getPaymentEnv(name: string): string | undefined {
  try {
    const env = getRequestContext().env as unknown as Record<string, string | undefined>;
    if (env && typeof env[name] === "string" && env[name]) return env[name];
  } catch {
    /* Ngoài Pages runtime (vd lúc build) getRequestContext ném lỗi — rơi
       xuống process.env bên dưới. */
  }
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/* Gốc URL của web, dùng làm returnUrl / cancelUrl cho các cổng. Ưu tiên
   NEXT_PUBLIC_SITE_URL (đặt trong env của Cloudflare Pages), nếu không có
   thì lấy origin từ request đang chạy. */
export function getSiteOrigin(req?: Request): string {
  const fromEnv = getPaymentEnv("NEXT_PUBLIC_SITE_URL");
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (req) {
    try {
      return new URL(req.url).origin;
    } catch {}
  }
  return "";
}
