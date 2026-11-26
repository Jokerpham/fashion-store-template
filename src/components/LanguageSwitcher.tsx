"use client";
/* Menu thả xuống chọn ngôn ngữ (v7) — dùng chung cho header shop, header
   admin và màn hình đăng nhập admin. Liệt kê 134 ngôn ngữ (cờ + tên
   tiếng Anh), có ô tìm kiếm lọc theo mã, tên tiếng Anh hoặc tên bản ngữ.
   Mỗi dòng chỉ hiện MỘT tên (tên tiếng Anh, chữ thường, không in đậm).
   `dark` để chữ sáng khi đặt trên nền tối (sidebar admin). Bấm ra ngoài
   hoặc phím Escape để đóng. Cờ là file SVG tự chứa ở public/flags/
   (xem src/components/FlagIcon.tsx). */
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { LANGUAGES, getLanguage } from "@/lib/i18n";
import FlagIcon from "./FlagIcon";

export default function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { lang, setLang, t, loading } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const current = getLanguage(lang);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.code.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const pick = (code: string) => {
    setLang(code);
    setOpen(false);
    setQuery("");
  };

  const btnCls = dark
    ? "text-white/85 hover:text-white"
    : "text-inherit hover:opacity-80";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.name")}
        className={`flex cursor-pointer items-center gap-1.5 text-[11px] tracking-[0.14em] font-heading ${btnCls}`}
      >
        <FlagIcon flag={current.flag} />
        <span className={loading ? "opacity-60" : ""}>{current.native}</span>
        <span
          aria-hidden="true"
          className={`inline-block text-[9px] transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[70] mt-2 w-64 overflow-hidden rounded-md border border-neutral-200 bg-white text-neutral-800 shadow-xl">
          <div className="border-b border-neutral-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("header.search")}
              aria-label={t("language.name")}
              className="w-full rounded border border-neutral-200 px-2 py-1.5 text-xs tracking-normal outline-none focus:border-neutral-400"
            />
          </div>
          <ul
            role="listbox"
            aria-label={t("language.name")}
            className="max-h-72 overflow-y-auto py-1 text-left"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-neutral-400">
                {t("shop.empty")}
              </li>
            )}
            {filtered.map((l) => (
              <li key={l.code} role="option" aria-selected={l.code === lang}>
                <button
                  type="button"
                  onClick={() => pick(l.code)}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs font-normal text-neutral-800 hover:bg-neutral-100 ${
                    l.code === lang ? "bg-neutral-100 text-black" : ""
                  }`}
                >
                  <FlagIcon flag={l.flag} />
                  <span className="truncate">{l.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
