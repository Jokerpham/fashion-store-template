/* Nạp lười từ điển theo ngôn ngữ (v7).
   Chỉ tiếng Việt + tiếng Anh được bundle sẵn (nạp ngay từ sections).
   132 ngôn ngữ còn lại nằm ở src/lib/i18n/dictionaries/<mã>.ts và chỉ
   được tải khi người dùng chọn ngôn ngữ đó — import() động giúp webpack
   tách mỗi ngôn ngữ thành 1 chunk riêng, bundle ban đầu không phình to.
   Từ điển đã nạp được cache trong bộ nhớ cho lần chọn sau. */
import { vi, en, type Dictionary } from "./bundled";
import { getLanguage } from "./languages";

const cache = new Map<string, Dictionary>([
  ["vi", vi],
  ["en", en],
]);

export function isDictionaryLoaded(code: string): boolean {
  return cache.has(code);
}

/* Trả về từ điển của ngôn ngữ, hoặc null khi không tải được (vd file
   từ điển thiếu) — phía gọi sẽ rơi về tiếng Anh nhờ translateWith. */
export async function loadDictionary(code: string): Promise<Dictionary | null> {
  const known = getLanguage(code);
  const cached = cache.get(known.code);
  if (cached) return cached;
  try {
    const mod = (await import(
      /* webpackChunkName: "i18n-[request]" */
      `./dictionaries/${known.code}`
    )) as unknown as { default?: Dictionary };
    const dict = mod?.default;
    if (dict && typeof dict === "object") {
      cache.set(known.code, dict);
      return dict;
    }
    return null;
  } catch {
    return null;
  }
}
