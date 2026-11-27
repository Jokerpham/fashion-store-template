"use client";
/* Ngôn ngữ giao diện (v16): chỉ "en" (mặc định) và "vi" (xem
   src/lib/i18n/languages.ts). Lựa chọn lưu ở localStorage (khóa
   fashion-lang) nên lần sau mở lại vẫn giữ. Lần render đầu luôn là
   "en" để tránh lệch hydration giữa server và trình duyệt; lựa chọn
   đã lưu được nạp lại ngay sau khi mount. Cả 2 ngôn ngữ đều được
   bundle sẵn nên đổi ngôn ngữ là có ngay, không phải tải thêm.
   Khi đổi ngôn ngữ, thẻ <html> được cập nhật cả lang lẫn dir. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  translateWith,
  loadDictionary,
  getLanguage,
  isRTL,
  DEFAULT_LANG,
  vi as viDict,
  type Lang,
  type Dictionary,
} from "@/lib/i18n";

export const LANGUAGE_STORAGE_KEY = "fashion-lang";

type LanguageCtx = {
  lang: Lang;
  setLang: (code: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  loading: boolean;
};

const Ctx = createContext<LanguageCtx>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key, vars) => translateWith(null, DEFAULT_LANG, key, vars),
  loading: false,
});

function readSavedLang(): string {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved) return getLanguage(saved).code;
  } catch {
    /* localStorage không dùng được thì giữ mặc định vi. */
  }
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  // Mặc định là "en": translateWith tự rơi về từ điển tiếng Anh khi dict
  // null, nên lần render đầu không cần nạp sẵn từ điển nào.
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);

  const applyLanguage = useCallback(async (code: string) => {
    const target = getLanguage(code).code;
    const req = ++requestRef.current;
    if (target === "vi" || target === "en") {
      setDict(target === "vi" ? viDict : null);
      // en dùng từ điển bundle sẵn: translateWith tự rơi về en khi dict null.
      setLangState(target);
      setLoading(false);
      return;
    }
    setLoading(true);
    const loaded = await loadDictionary(target);
    if (requestRef.current !== req) return; // đã bấm sang ngôn ngữ khác
    setDict(loaded);
    setLangState(target);
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = readSavedLang();
    if (saved !== DEFAULT_LANG) void applyLanguage(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
      document.documentElement.dir = isRTL(lang) ? "rtl" : "ltr";
    } catch {
      /* không chạy trên trình duyệt thì bỏ qua. */
    }
  }, [lang]);

  const setLang = useCallback(
    (code: string) => {
      const target = getLanguage(code).code;
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, target);
      } catch {
        /* localStorage không dùng được thì vẫn đổi ngôn ngữ cho phiên này. */
      }
      void applyLanguage(target);
    },
    [applyLanguage],
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translateWith(dict, lang, key, vars),
    [dict, lang],
  );

  return (
    <Ctx.Provider value={{ lang, setLang, t, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLanguage(): LanguageCtx {
  return useContext(Ctx);
}
