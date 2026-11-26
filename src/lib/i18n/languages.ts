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
};

export const LANGUAGES: LanguageInfo[] = [
  { code: "ak", name: "Akan", native: "Akan", dir: "ltr" },
  { code: "af", name: "Afrikaans", native: "Afrikaans", dir: "ltr" },
  { code: "sq", name: "Albanian", native: "shqip", dir: "ltr" },
  { code: "am", name: "Amharic", native: "አማርኛ", dir: "ltr" },
  { code: "ar", name: "Arabic", native: "العربية", dir: "rtl" },
  { code: "hy", name: "Armenian", native: "հայերեն", dir: "ltr" },
  { code: "as", name: "Assamese", native: "অসমীয়া", dir: "ltr" },
  { code: "ay", name: "Aymara", native: "Aymar", dir: "ltr" },
  { code: "az", name: "Azerbaijani", native: "azərbaycan", dir: "ltr" },
  { code: "bm", name: "Bambara", native: "bamanakan", dir: "ltr" },
  { code: "eu", name: "Basque", native: "euskara", dir: "ltr" },
  { code: "be", name: "Belarusian", native: "беларуская", dir: "ltr" },
  { code: "bn", name: "Bengali", native: "বাংলা", dir: "ltr" },
  { code: "bho", name: "Bhojpuri", native: "भोजपुरी", dir: "ltr" },
  { code: "bs", name: "Bosnian", native: "bosanski", dir: "ltr" },
  { code: "bg", name: "Bulgarian", native: "български", dir: "ltr" },
  { code: "my", name: "Burmese", native: "မြန်မာ", dir: "ltr" },
  { code: "ca", name: "Catalan", native: "català", dir: "ltr" },
  { code: "ceb", name: "Cebuano", native: "Cebuano", dir: "ltr" },
  { code: "ckb", name: "Central Kurdish", native: "کوردی ناوەندی", dir: "rtl" },
  { code: "zh", name: "Chinese", native: "中文", dir: "ltr" },
  { code: "zh-CN", name: "Chinese (Simplified)", native: "中文（简体）", dir: "ltr" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "中文（繁體）", dir: "ltr" },
  { code: "co", name: "Corsican", native: "Corsu", dir: "ltr" },
  { code: "hr", name: "Croatian", native: "hrvatski", dir: "ltr" },
  { code: "cs", name: "Czech", native: "čeština", dir: "ltr" },
  { code: "da", name: "Danish", native: "dansk", dir: "ltr" },
  { code: "dv", name: "Divehi", native: "ދިވެހި", dir: "rtl" },
  { code: "doi", name: "Dogri", native: "डोगरी", dir: "ltr" },
  { code: "nl", name: "Dutch", native: "Nederlands", dir: "ltr" },
  { code: "en", name: "English", native: "English", dir: "ltr" },
  { code: "eo", name: "Esperanto", native: "Esperanto", dir: "ltr" },
  { code: "et", name: "Estonian", native: "eesti", dir: "ltr" },
  { code: "ee", name: "Ewe", native: "eʋegbe", dir: "ltr" },
  { code: "tl", name: "Filipino", native: "Filipino", dir: "ltr" },
  { code: "fi", name: "Finnish", native: "suomi", dir: "ltr" },
  { code: "fr", name: "French", native: "français", dir: "ltr" },
  { code: "fy", name: "Frisian", native: "Frysk", dir: "ltr" },
  { code: "gl", name: "Galician", native: "galego", dir: "ltr" },
  { code: "lg", name: "Ganda", native: "Luganda", dir: "ltr" },
  { code: "ka", name: "Georgian", native: "ქართული", dir: "ltr" },
  { code: "de", name: "German", native: "Deutsch", dir: "ltr" },
  { code: "el", name: "Greek", native: "Ελληνικά", dir: "ltr" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", dir: "ltr" },
  { code: "gn", name: "Guarani", native: "Guarani", dir: "ltr" },
  { code: "ht", name: "Haitian Creole", native: "créole haïtien", dir: "ltr" },
  { code: "ha", name: "Hausa", native: "Hausa", dir: "ltr" },
  { code: "haw", name: "Hawaiian", native: "ʻŌlelo Hawaiʻi", dir: "ltr" },
  { code: "he", name: "Hebrew", native: "עברית", dir: "rtl" },
  { code: "hi", name: "Hindi", native: "हिन्दी", dir: "ltr" },
  { code: "hmn", name: "Hmong", native: "Hmoob", dir: "ltr" },
  { code: "hu", name: "Hungarian", native: "magyar", dir: "ltr" },
  { code: "is", name: "Icelandic", native: "íslenska", dir: "ltr" },
  { code: "ig", name: "Igbo", native: "Igbo", dir: "ltr" },
  { code: "ilo", name: "Ilocano", native: "Ilokano", dir: "ltr" },
  { code: "id", name: "Indonesian", native: "Indonesia", dir: "ltr" },
  { code: "ga", name: "Irish", native: "Gaeilge", dir: "ltr" },
  { code: "it", name: "Italian", native: "italiano", dir: "ltr" },
  { code: "ja", name: "Japanese", native: "日本語", dir: "ltr" },
  { code: "jv", name: "Javanese", native: "Jawa", dir: "ltr" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", dir: "ltr" },
  { code: "kk", name: "Kazakh", native: "қазақ тілі", dir: "ltr" },
  { code: "km", name: "Khmer", native: "ខ្មែរ", dir: "ltr" },
  { code: "rw", name: "Kinyarwanda", native: "Ikinyarwanda", dir: "ltr" },
  { code: "gom", name: "Konkani", native: "कोंकणी", dir: "ltr" },
  { code: "ko", name: "Korean", native: "한국어", dir: "ltr" },
  { code: "ku", name: "Kurdish", native: "Kurdî", dir: "ltr" },
  { code: "ky", name: "Kyrgyz", native: "кыргызча", dir: "ltr" },
  { code: "lo", name: "Lao", native: "ລາວ", dir: "ltr" },
  { code: "la", name: "Latin", native: "Latina", dir: "ltr" },
  { code: "lv", name: "Latvian", native: "latviešu", dir: "ltr" },
  { code: "ln", name: "Lingala", native: "língala", dir: "ltr" },
  { code: "lt", name: "Lithuanian", native: "lietuvių", dir: "ltr" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch", dir: "ltr" },
  { code: "mk", name: "Macedonian", native: "македонски", dir: "ltr" },
  { code: "mai", name: "Maithili", native: "मैथिली", dir: "ltr" },
  { code: "mg", name: "Malagasy", native: "Malagasy", dir: "ltr" },
  { code: "ms", name: "Malay", native: "Melayu", dir: "ltr" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", dir: "ltr" },
  { code: "mt", name: "Maltese", native: "Malti", dir: "ltr" },
  { code: "mni", name: "Manipuri", native: "ꯃꯩꯇꯩꯂꯣꯟ", dir: "ltr" },
  { code: "mi", name: "Maori", native: "Māori", dir: "ltr" },
  { code: "mr", name: "Marathi", native: "मराठी", dir: "ltr" },
  { code: "lus", name: "Mizo", native: "Mizo ṭawng", dir: "ltr" },
  { code: "mn", name: "Mongolian", native: "монгол", dir: "ltr" },
  { code: "ne", name: "Nepali", native: "नेपाली", dir: "ltr" },
  { code: "nso", name: "Northern Sotho", native: "Sesotho sa Leboa", dir: "ltr" },
  { code: "no", name: "Norwegian", native: "norsk", dir: "ltr" },
  { code: "nn", name: "Norwegian Nynorsk", native: "norsk nynorsk", dir: "ltr" },
  { code: "ny", name: "Nyanja", native: "Chichewa", dir: "ltr" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", dir: "ltr" },
  { code: "om", name: "Oromo", native: "Oromoo", dir: "ltr" },
  { code: "ps", name: "Pashto", native: "پښتو", dir: "rtl" },
  { code: "fa", name: "Persian", native: "فارسی", dir: "rtl" },
  { code: "pl", name: "Polish", native: "polski", dir: "ltr" },
  { code: "pt", name: "Portuguese", native: "português", dir: "ltr" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", dir: "ltr" },
  { code: "qu", name: "Quechua", native: "Runasimi", dir: "ltr" },
  { code: "ro", name: "Romanian", native: "română", dir: "ltr" },
  { code: "ru", name: "Russian", native: "русский", dir: "ltr" },
  { code: "sm", name: "Samoan", native: "Samoa", dir: "ltr" },
  { code: "sa", name: "Sanskrit", native: "संस्कृत भाषा", dir: "ltr" },
  { code: "gd", name: "Scottish Gaelic", native: "Gàidhlig", dir: "ltr" },
  { code: "sr", name: "Serbian", native: "српски", dir: "ltr" },
  { code: "sn", name: "Shona", native: "chiShona", dir: "ltr" },
  { code: "sd", name: "Sindhi", native: "سنڌي", dir: "rtl" },
  { code: "si", name: "Sinhala", native: "සිංහල", dir: "ltr" },
  { code: "sk", name: "Slovak", native: "slovenčina", dir: "ltr" },
  { code: "sl", name: "Slovenian", native: "slovenščina", dir: "ltr" },
  { code: "so", name: "Somali", native: "Soomaali", dir: "ltr" },
  { code: "st", name: "Southern Sotho", native: "Sesotho", dir: "ltr" },
  { code: "es", name: "Spanish", native: "español", dir: "ltr" },
  { code: "su", name: "Sundanese", native: "Basa Sunda", dir: "ltr" },
  { code: "sw", name: "Swahili", native: "Kiswahili", dir: "ltr" },
  { code: "sv", name: "Swedish", native: "svenska", dir: "ltr" },
  { code: "tg", name: "Tajik", native: "тоҷикӣ", dir: "ltr" },
  { code: "ta", name: "Tamil", native: "தமிழ்", dir: "ltr" },
  { code: "tt", name: "Tatar", native: "татар", dir: "ltr" },
  { code: "te", name: "Telugu", native: "తెలుగు", dir: "ltr" },
  { code: "th", name: "Thai", native: "ไทย", dir: "ltr" },
  { code: "ti", name: "Tigrinya", native: "ትግርኛ", dir: "ltr" },
  { code: "ts", name: "Tsonga", native: "Xitsonga", dir: "ltr" },
  { code: "tr", name: "Turkish", native: "Türkçe", dir: "ltr" },
  { code: "tk", name: "Turkmen", native: "türkmen dili", dir: "ltr" },
  { code: "uk", name: "Ukrainian", native: "українська", dir: "ltr" },
  { code: "ur", name: "Urdu", native: "اردو", dir: "rtl" },
  { code: "ug", name: "Uyghur", native: "ئۇيغۇرچە", dir: "rtl" },
  { code: "uz", name: "Uzbek", native: "o'zbek", dir: "ltr" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", dir: "ltr" },
  { code: "cy", name: "Welsh", native: "Cymraeg", dir: "ltr" },
  { code: "xh", name: "Xhosa", native: "IsiXhosa", dir: "ltr" },
  { code: "yi", name: "Yiddish", native: "ייִדיש", dir: "rtl" },
  { code: "yo", name: "Yoruba", native: "Èdè Yorùbá", dir: "ltr" },
  { code: "zu", name: "Zulu", native: "isiZulu", dir: "ltr" },
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
