/* Nạp từ điển theo ngôn ngữ (v16).
   Chỉ còn 2 ngôn ngữ — tiếng Việt + tiếng Anh — đều được bundle sẵn
   (xem bundled.ts), nên không cần nạp lười nữa. Hàm loadDictionary
   giữ nguyên chữ ký để LanguageContext không phải đổi: nó trả về
   từ điển bundle sẵn của ngôn ngữ, hoặc null khi mã không hợp lệ
   (phía gọi sẽ rơi về tiếng Anh nhờ translateWith). Từ điển được
   cache trong bộ nhớ. */
import { vi, en, type Dictionary } from "./bundled";
import { getLanguage } from "./languages";

const cache = new Map<string, Dictionary>([
  ["vi", vi],
  ["en", en],
]);

export function isDictionaryLoaded(code: string): boolean {
  return cache.has(code);
}

/* Trả về từ điển của ngôn ngữ, hoặc null khi mã không hợp lệ. */
export async function loadDictionary(code: string): Promise<Dictionary | null> {
  const known = getLanguage(code);
  return cache.get(known.code) ?? null;
}
