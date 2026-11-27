/* Danh sách ngôn ngữ (v16) — chỉ 2 ngôn ngữ: tiếng Anh (mặc định)
   và tiếng Việt. Các bản trước có 134 ngôn ngữ (danh sách Google
   Translate), nhưng từ v16 chỉ giữ lại 2 ngôn ngữ này theo yêu cầu
   của người dùng; 132 file từ điển ở src/lib/i18n/dictionaries/ đã
   bị xóa. Mỗi mục: mã ISO, tên tiếng Anh, tên bản ngữ, hướng chữ,
   mã cờ (file SVG ở public/flags/<mã>.svg).
   Thêm ngôn ngữ mới = thêm 1 dòng vào đây + 1 file từ điển ở
   src/lib/i18n/dictionaries/<mã>.ts + cờ ở public/flags/ (xem
   README mục "Languages"), rồi chạy node scripts/check-i18n.cjs. */
export type LanguageInfo = {
  code: string;
  name: string;
  native: string;
  dir: "ltr" | "rtl";
  /* Mã cờ hiển thị trong menu đổi ngôn ngữ: mã quốc gia ISO
     (file SVG ở public/flags/<mã>.svg). */
  flag: string;
};

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", native: "English", dir: "ltr", flag: "gb" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", dir: "ltr", flag: "vn" },
];

export const LANGUAGE_MAP: Record<string, LanguageInfo> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l]),
);

export function getLanguage(code: string): LanguageInfo {
  return LANGUAGE_MAP[code] ?? LANGUAGE_MAP[DEFAULT_LANG];
}

export function isRTL(code: string): boolean {
  return getLanguage(code).dir === "rtl";
}

export const DEFAULT_LANG = "en";

/* BCP 47 locale dùng cho toLocaleString/toLocaleDateString:
   vi → vi-VN, en → en-US. */
export function localeForLang(code: string): string {
  if (code === "vi") return "vi-VN";
  return "en-US";
}
