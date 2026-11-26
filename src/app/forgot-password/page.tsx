"use client";
import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  return (
    <div className="container-x py-14 max-w-[500px]">
      <h1 className="text-4xl font-light text-center">{t("account.forgotTitle")}</h1>
      {sent ? (
        <div className="mt-10 bg-emerald-50 border border-emerald-200 p-6 text-center">
          <p className="text-emerald-700 font-medium">{t("account.forgotSentTitle")}</p>
          <p className="text-sm text-neutral-500 mt-2">
            {t("account.forgotSentText")}
          </p>
          <Link href="/account" className="inline-block underline mt-5 text-sm">{t("account.backToLogin")}</Link>
        </div>
      ) : (
        <form
          className="mt-10 space-y-8"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <p className="text-neutral-500 text-sm leading-relaxed">
            {t("account.forgotIntro")}
          </p>
          <div>
            <label htmlFor="fp-email" className="block text-[15px] text-neutral-500 mb-1">
              {t("account.emailLabel")} <span className="text-red-500">*</span>
            </label>
            <input
              id="fp-email"
              type="email"
              required
              className="w-full bg-transparent border-b border-neutral-300 focus:border-black outline-none py-3"
            />
          </div>
          <button className="w-full bg-[#171a21] text-white py-5 text-sm tracking-[0.2em]">
            {t("account.forgotSubmit")}
          </button>
          <p className="text-center">
            <Link href="/account" className="text-sm underline underline-offset-4">{t("account.backToLogin")}</Link>
          </p>
        </form>
      )}
    </div>
  );
}
