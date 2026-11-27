/* Từ điển đa ngôn ngữ (v16) — lõi tra cứu + hàm phụ trợ.
   Ngôn ngữ mặc định là "en"; chỉ còn 2 ngôn ngữ (en + vi, xem
   src/lib/i18n/languages.ts), cả 2 đều bundle sẵn. Mọi chuỗi thiếu
   bản dịch sẽ rơi về tiếng Anh, rồi tiếng Việt, cuối cùng là chính
   khóa — web không bao giờ hiện ô trống vì thiếu key. */
export type Lang = string;

/* Cây từ điển: khóa lồng nhau, lá luôn là chuỗi. */
export type DictNode = string | { [key: string]: DictNode };
export type Dictionary = { [key: string]: DictNode };

/* Tra cứu "a.b.c" trong cây từ điển; trả undefined khi thiếu. */
export function lookup(dict: Dictionary, path: string): string | undefined {
  const parts = path.split(".");
  let cur: DictNode | undefined = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object") cur = (cur as Dictionary)[p];
    else return undefined;
  }
  return typeof cur === "string" ? cur : undefined;
}

/* Chèn biến dạng {ten} vào chuỗi dịch. */
export function interpolate(
  s: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
  );
}

/* ---- Tên / mô tả sản phẩm theo ngôn ngữ ----
   name trong CSDL vốn đã là tiếng Anh (vd "Guide Pack Cap") nên tiếng
   Việt hiển thị name như cũ; mọi ngôn ngữ khác (kể cả tiếng Anh) ưu
   tiên nameEn rồi rơi về name. Mô tả thì ngược lại: tiếng Việt dùng
   description, mọi ngôn ngữ khác dùng descriptionEn, thiếu thì rơi về
   description. */
export function productName(
  p: { name: string; nameEn?: string | null },
  lang: Lang,
): string {
  if (lang === "vi") return p.name;
  const en = (p.nameEn ?? "").trim();
  return en || p.name;
}

export function productDescription(
  p: { description: string; descriptionEn?: string | null },
  lang: Lang,
): string {
  if (lang === "vi") return p.description;
  const en = (p.descriptionEn ?? "").trim();
  return en || p.description;
}

/* ---- Trạng thái đơn hàng ----
   Trong app, trạng thái đơn lưu bằng chuỗi tiếng Việt (xem src/lib/store.ts,
   mã CSDL ngắn nằm ở src/lib/db-map.ts). Hiển thị thì dịch qua bảng này. */
export const STATUS_EN: Record<string, string> = {
  "Chờ xác nhận": "Pending confirmation",
  "Chờ thanh toán": "Awaiting payment",
  "Đã thanh toán": "Paid",
  "Đang chuẩn bị hàng": "Preparing",
  "Đang giao": "Shipping",
  "Đã giao": "Delivered",
  "Đã hủy": "Cancelled",
  "Hoàn trả": "Returned",
};

export function statusLabel(status: string, lang: Lang): string {
  if (lang === "vi") return status;
  return STATUS_EN[status] ?? status;
}

/* ---- Phương thức thanh toán ----
   Nhãn thanh toán lưu trong đơn là chuỗi tiếng Việt (vd "PayOS — VietQR /
   ATM / ví"). Hàm này đoán mã cổng từ nhãn (hoặc từ mã đã lưu), để tra
   nhãn dịch trong từ điển ở khóa payment.<mã>. */
export type PaymentMethodKey =
  | "cod"
  | "bank"
  | "momo"
  | "zalopay"
  | "payos"
  | "sepay";

export function paymentMethodKey(labelOrCode: string): PaymentMethodKey {
  const s = (labelOrCode ?? "").toLowerCase();
  if (s.includes("payos")) return "payos";
  if (s.includes("sepay")) return "sepay";
  if (s.includes("momo")) return "momo";
  if (s.includes("zalopay")) return "zalopay";
  if (s.includes("chuyển khoản") || s.includes("bank")) return "bank";
  return "cod";
}

/* ---- Danh mục sản phẩm ----
   Tên danh mục trong CSDL vốn là tiếng Anh; tra cứu theo slug để hiện
   tên tiếng Việt khi đang ở ngôn ngữ vi. */
export const CATEGORY_LABELS_I18N: Record<
  string,
  { vi: string; en: string }
> = {
  woman: { vi: "Nữ", en: "Woman" },
  man: { vi: "Nam", en: "Man" },
  accessories: { vi: "Phụ kiện", en: "Accessories" },
  bags: { vi: "Túi xách", en: "Bags" },
  footwear: { vi: "Giày dép", en: "Footwear" },
};

export function categoryLabel(slugOrName: string, lang: Lang): string {
  const key = (slugOrName ?? "").toLowerCase();
  const found = CATEGORY_LABELS_I18N[key];
  if (!found) return slugOrName;
  return lang === "vi" ? found.vi : found.en;
}
