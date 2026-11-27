/* Gộp từ điển các section + hàm dịch chính.
   Phân chia khóa cấp cao (mỗi section chỉ dùng khóa của mình, tránh đụng):
   - common: nav, header, language, common, footer, cart, auth, payment
   - shop:   home, shop, product, checkout, account, contact, about, blog,
             comingSoon, weekend, misc
   - admin:  admin
   t(lang, key): thiếu bản dịch ở ngôn ngữ đang chọn thì rơi về tiếng Anh,
   rồi tiếng Việt, cuối cùng trả về chính khóa — không bao giờ trả chuỗi
   rỗng. vi/en được bundle sẵn; loadDictionary (loader.ts) chỉ trả về
   từ điển bundle sẵn của ngôn ngữ đang chọn. */
import { lookup, interpolate, type Lang, type Dictionary } from "./dictionary";
import { vi, en } from "./bundled";

export type { Lang };
export * from "./dictionary";
export * from "./languages";
export * from "./loader";
export { vi, en };

/* Dịch với từ điển đang kích hoạt (có thể là từ điển nạp lười).
   Thứ tự rơi: từ điển ngôn ngữ đang chọn → tiếng Anh → tiếng Việt → key. */
export function translateWith(
  activeDict: Dictionary | null | undefined,
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const found =
    (activeDict ? lookup(activeDict, key) : undefined) ??
    lookup(en, key) ??
    lookup(vi, key);
  return interpolate(found ?? key, vars);
}

export function translate(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const primary = lang === "en" ? en : vi;
  const fallback = lang === "en" ? vi : en;
  const found = lookup(primary, key) ?? lookup(fallback, key);
  return interpolate(found ?? key, vars);
}
