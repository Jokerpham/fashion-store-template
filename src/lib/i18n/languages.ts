/* Danh sách ngôn ngữ đầy đủ (v7) — theo danh sách ngôn ngữ của Google
   Translate mà người dùng chụp màn hình (134 ngôn ngữ, từ Ả Rập tới
   Zulu, gồm cả tiếng Việt và tiếng Anh). Mỗi mục: mã ISO, tên tiếng Anh,
   tên bản ngữ, hướng chữ (rtl cho các ngôn ngữ viết từ phải sang trái).
   Thêm ngôn ngữ mới = thêm 1 dòng vào đây + 1 file từ điển ở
   src/lib/i18n/dictionaries/<mã>.ts (xem README mục "Languages"). */
export type LanguageInfo = {
  code: string;
  name: string;
  native: string;
  dir: "ltr" | "rtl";
  /* Mã cờ hiển thị trong menu đổi ngôn ngữ: mã quốc gia ISO
     (file SVG ở public/flags/<mã>.svg) hoặc "globe" cho ngôn ngữ
     không gắn với quốc gia nào (Esperanto, Latin, Kurdish...). */
  flag: string;
};

export const LANGUAGES: LanguageInfo[] = [
  { code: "ak", name: "Akan", native: "Akan", dir: "ltr", flag: "gh" },
  { code: "af", name: "Afrikaans", native: "Afrikaans", dir: "ltr", flag: "za" },
  { code: "sq", name: "Albanian", native: "shqip", dir: "ltr", flag: "al" },
  { code: "am", name: "Amharic", native: "አማርኛ", dir: "ltr", flag: "et" },
  { code: "ar", name: "Arabic", native: "العربية", dir: "rtl", flag: "sa" },
  { code: "hy", name: "Armenian", native: "հայերեն", dir: "ltr", flag: "am" },
  { code: "as", name: "Assamese", native: "অসমীয়া", dir: "ltr", flag: "in" },
  { code: "ay", name: "Aymara", native: "Aymar", dir: "ltr", flag: "bo" },
  { code: "az", name: "Azerbaijani", native: "azərbaycan", dir: "ltr", flag: "az" },
  { code: "bm", name: "Bambara", native: "bamanakan", dir: "ltr", flag: "ml" },
  { code: "eu", name: "Basque", native: "euskara", dir: "ltr", flag: "es" },
  { code: "be", name: "Belarusian", native: "беларуская", dir: "ltr", flag: "by" },
  { code: "bn", name: "Bengali", native: "বাংলা", dir: "ltr", flag: "bd" },
  { code: "bho", name: "Bhojpuri", native: "भोजपुरी", dir: "ltr", flag: "in" },
  { code: "bs", name: "Bosnian", native: "bosanski", dir: "ltr", flag: "ba" },
  { code: "bg", name: "Bulgarian", native: "български", dir: "ltr", flag: "bg" },
  { code: "my", name: "Burmese", native: "မြန်မာ", dir: "ltr", flag: "mm" },
  { code: "ca", name: "Catalan", native: "català", dir: "ltr", flag: "es" },
  { code: "ceb", name: "Cebuano", native: "Cebuano", dir: "ltr", flag: "ph" },
  { code: "ckb", name: "Central Kurdish", native: "کوردی ناوەندی", dir: "rtl", flag: "globe" },
  { code: "zh", name: "Chinese", native: "中文", dir: "ltr", flag: "cn" },
  { code: "zh-CN", name: "Chinese (Simplified)", native: "中文（简体）", dir: "ltr", flag: "cn" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "中文（繁體）", dir: "ltr", flag: "tw" },
  { code: "co", name: "Corsican", native: "Corsu", dir: "ltr", flag: "fr" },
  { code: "hr", name: "Croatian", native: "hrvatski", dir: "ltr", flag: "hr" },
  { code: "cs", name: "Czech", native: "čeština", dir: "ltr", flag: "cz" },
  { code: "da", name: "Danish", native: "dansk", dir: "ltr", flag: "dk" },
  { code: "dv", name: "Divehi", native: "ދިވެހި", dir: "rtl", flag: "mv" },
  { code: "doi", name: "Dogri", native: "डोगरी", dir: "ltr", flag: "in" },
  { code: "nl", name: "Dutch", native: "Nederlands", dir: "ltr", flag: "nl" },
  { code: "en", name: "English", native: "English", dir: "ltr", flag: "gb" },
  { code: "eo", name: "Esperanto", native: "Esperanto", dir: "ltr", flag: "globe" },
  { code: "et", name: "Estonian", native: "eesti", dir: "ltr", flag: "ee" },
  { code: "ee", name: "Ewe", native: "eʋegbe", dir: "ltr", flag: "gh" },
  { code: "tl", name: "Filipino", native: "Filipino", dir: "ltr", flag: "ph" },
  { code: "fi", name: "Finnish", native: "suomi", dir: "ltr", flag: "fi" },
  { code: "fr", name: "French", native: "français", dir: "ltr", flag: "fr" },
  { code: "fy", name: "Frisian", native: "Frysk", dir: "ltr", flag: "nl" },
  { code: "gl", name: "Galician", native: "galego", dir: "ltr", flag: "es" },
  { code: "lg", name: "Ganda", native: "Luganda", dir: "ltr", flag: "ug" },
  { code: "ka", name: "Georgian", native: "ქართული", dir: "ltr", flag: "ge" },
  { code: "de", name: "German", native: "Deutsch", dir: "ltr", flag: "de" },
  { code: "el", name: "Greek", native: "Ελληνικά", dir: "ltr", flag: "gr" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", dir: "ltr", flag: "in" },
  { code: "gn", name: "Guarani", native: "Guarani", dir: "ltr", flag: "py" },
  { code: "ht", name: "Haitian Creole", native: "créole haïtien", dir: "ltr", flag: "ht" },
  { code: "ha", name: "Hausa", native: "Hausa", dir: "ltr", flag: "ng" },
  { code: "haw", name: "Hawaiian", native: "ʻŌlelo Hawaiʻi", dir: "ltr", flag: "us" },
  { code: "he", name: "Hebrew", native: "עברית", dir: "rtl", flag: "il" },
  { code: "hi", name: "Hindi", native: "हिन्दी", dir: "ltr", flag: "in" },
  { code: "hmn", name: "Hmong", native: "Hmoob", dir: "ltr", flag: "cn" },
  { code: "hu", name: "Hungarian", native: "magyar", dir: "ltr", flag: "hu" },
  { code: "is", name: "Icelandic", native: "íslenska", dir: "ltr", flag: "is" },
  { code: "ig", name: "Igbo", native: "Igbo", dir: "ltr", flag: "ng" },
  { code: "ilo", name: "Ilocano", native: "Ilokano", dir: "ltr", flag: "ph" },
  { code: "id", name: "Indonesian", native: "Indonesia", dir: "ltr", flag: "id" },
  { code: "ga", name: "Irish", native: "Gaeilge", dir: "ltr", flag: "ie" },
  { code: "it", name: "Italian", native: "italiano", dir: "ltr", flag: "it" },
  { code: "ja", name: "Japanese", native: "日本語", dir: "ltr", flag: "jp" },
  { code: "jv", name: "Javanese", native: "Jawa", dir: "ltr", flag: "id" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", dir: "ltr", flag: "in" },
  { code: "kk", name: "Kazakh", native: "қазақ тілі", dir: "ltr", flag: "kz" },
  { code: "km", name: "Khmer", native: "ខ្មែរ", dir: "ltr", flag: "kh" },
  { code: "rw", name: "Kinyarwanda", native: "Ikinyarwanda", dir: "ltr", flag: "rw" },
  { code: "gom", name: "Konkani", native: "कोंकणी", dir: "ltr", flag: "in" },
  { code: "ko", name: "Korean", native: "한국어", dir: "ltr", flag: "kr" },
  { code: "ku", name: "Kurdish", native: "Kurdî", dir: "ltr", flag: "globe" },
  { code: "ky", name: "Kyrgyz", native: "кыргызча", dir: "ltr", flag: "kg" },
  { code: "lo", name: "Lao", native: "ລາວ", dir: "ltr", flag: "la" },
  { code: "la", name: "Latin", native: "Latina", dir: "ltr", flag: "globe" },
  { code: "lv", name: "Latvian", native: "latviešu", dir: "ltr", flag: "lv" },
  { code: "ln", name: "Lingala", native: "língala", dir: "ltr", flag: "cd" },
  { code: "lt", name: "Lithuanian", native: "lietuvių", dir: "ltr", flag: "lt" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch", dir: "ltr", flag: "lu" },
  { code: "mk", name: "Macedonian", native: "македонски", dir: "ltr", flag: "mk" },
  { code: "mai", name: "Maithili", native: "मैथिली", dir: "ltr", flag: "in" },
  { code: "mg", name: "Malagasy", native: "Malagasy", dir: "ltr", flag: "mg" },
  { code: "ms", name: "Malay", native: "Melayu", dir: "ltr", flag: "my" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", dir: "ltr", flag: "in" },
  { code: "mt", name: "Maltese", native: "Malti", dir: "ltr", flag: "mt" },
  { code: "mni", name: "Manipuri", native: "ꯃꯩꯇꯩꯂꯣꯟ", dir: "ltr", flag: "in" },
  { code: "mi", name: "Maori", native: "Māori", dir: "ltr", flag: "nz" },
  { code: "mr", name: "Marathi", native: "मराठी", dir: "ltr", flag: "in" },
  { code: "lus", name: "Mizo", native: "Mizo ṭawng", dir: "ltr", flag: "in" },
  { code: "mn", name: "Mongolian", native: "монгол", dir: "ltr", flag: "mn" },
  { code: "ne", name: "Nepali", native: "नेपाली", dir: "ltr", flag: "np" },
  { code: "nso", name: "Northern Sotho", native: "Sesotho sa Leboa", dir: "ltr", flag: "za" },
  { code: "no", name: "Norwegian", native: "norsk", dir: "ltr", flag: "no" },
  { code: "nn", name: "Norwegian Nynorsk", native: "norsk nynorsk", dir: "ltr", flag: "no" },
  { code: "ny", name: "Nyanja", native: "Chichewa", dir: "ltr", flag: "mw" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", dir: "ltr", flag: "in" },
  { code: "om", name: "Oromo", native: "Oromoo", dir: "ltr", flag: "et" },
  { code: "ps", name: "Pashto", native: "پښتو", dir: "rtl", flag: "af" },
  { code: "fa", name: "Persian", native: "فارسی", dir: "rtl", flag: "ir" },
  { code: "pl", name: "Polish", native: "polski", dir: "ltr", flag: "pl" },
  { code: "pt", name: "Portuguese", native: "português", dir: "ltr", flag: "pt" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", dir: "ltr", flag: "in" },
  { code: "qu", name: "Quechua", native: "Runasimi", dir: "ltr", flag: "globe" },
  { code: "ro", name: "Romanian", native: "română", dir: "ltr", flag: "ro" },
  { code: "ru", name: "Russian", native: "русский", dir: "ltr", flag: "ru" },
  { code: "sm", name: "Samoan", native: "Samoa", dir: "ltr", flag: "ws" },
  { code: "sa", name: "Sanskrit", native: "संस्कृत भाषा", dir: "ltr", flag: "in" },
  { code: "gd", name: "Scottish Gaelic", native: "Gàidhlig", dir: "ltr", flag: "gb-sct" },
  { code: "sr", name: "Serbian", native: "српски", dir: "ltr", flag: "rs" },
  { code: "sn", name: "Shona", native: "chiShona", dir: "ltr", flag: "zw" },
  { code: "sd", name: "Sindhi", native: "سنڌي", dir: "rtl", flag: "pk" },
  { code: "si", name: "Sinhala", native: "සිංහල", dir: "ltr", flag: "lk" },
  { code: "sk", name: "Slovak", native: "slovenčina", dir: "ltr", flag: "sk" },
  { code: "sl", name: "Slovenian", native: "slovenščina", dir: "ltr", flag: "si" },
  { code: "so", name: "Somali", native: "Soomaali", dir: "ltr", flag: "so" },
  { code: "st", name: "Southern Sotho", native: "Sesotho", dir: "ltr", flag: "ls" },
  { code: "es", name: "Spanish", native: "español", dir: "ltr", flag: "es" },
  { code: "su", name: "Sundanese", native: "Basa Sunda", dir: "ltr", flag: "id" },
  { code: "sw", name: "Swahili", native: "Kiswahili", dir: "ltr", flag: "ke" },
  { code: "sv", name: "Swedish", native: "svenska", dir: "ltr", flag: "se" },
  { code: "tg", name: "Tajik", native: "тоҷикӣ", dir: "ltr", flag: "tj" },
  { code: "ta", name: "Tamil", native: "தமிழ்", dir: "ltr", flag: "in" },
  { code: "tt", name: "Tatar", native: "татар", dir: "ltr", flag: "ru" },
  { code: "te", name: "Telugu", native: "తెలుగు", dir: "ltr", flag: "in" },
  { code: "th", name: "Thai", native: "ไทย", dir: "ltr", flag: "th" },
  { code: "ti", name: "Tigrinya", native: "ትግርኛ", dir: "ltr", flag: "er" },
  { code: "ts", name: "Tsonga", native: "Xitsonga", dir: "ltr", flag: "za" },
  { code: "tr", name: "Turkish", native: "Türkçe", dir: "ltr", flag: "tr" },
  { code: "tk", name: "Turkmen", native: "türkmen dili", dir: "ltr", flag: "tm" },
  { code: "uk", name: "Ukrainian", native: "українська", dir: "ltr", flag: "ua" },
  { code: "ur", name: "Urdu", native: "اردو", dir: "rtl", flag: "pk" },
  { code: "ug", name: "Uyghur", native: "ئۇيغۇرچە", dir: "rtl", flag: "cn" },
  { code: "uz", name: "Uzbek", native: "o'zbek", dir: "ltr", flag: "uz" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", dir: "ltr", flag: "vn" },
  { code: "cy", name: "Welsh", native: "Cymraeg", dir: "ltr", flag: "gb-wls" },
  { code: "xh", name: "Xhosa", native: "IsiXhosa", dir: "ltr", flag: "za" },
  { code: "yi", name: "Yiddish", native: "ייִדיש", dir: "rtl", flag: "il" },
  { code: "yo", name: "Yoruba", native: "Èdè Yorùbá", dir: "ltr", flag: "ng" },
  { code: "zu", name: "Zulu", native: "isiZulu", dir: "ltr", flag: "za" },
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

/* BCP 47 locale dùng cho toLocaleString/toLocaleDateString: vi → vi-VN,
   en → en-US, còn lại dùng thẳng mã ISO (toLocaleString chấp nhận mã
   ISO 639, vd "ar", "zh-CN"). */
export function localeForLang(code: string): string {
  if (code === "vi") return "vi-VN";
  if (code === "en") return "en-US";
  return code;
}
