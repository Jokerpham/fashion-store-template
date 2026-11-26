"use client";
import { useSubscribers } from "@/lib/store";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { logActivity } from "@/lib/activity";
import { useLanguage } from "@/context/LanguageContext";
import { localeForLang } from "@/lib/i18n";

export default function AdminSubscribers() {
  const { lang, t } = useLanguage();
  const locale = localeForLang(lang);
  const { subscribers, deleteSubscriber } = useSubscribers();
  const { user } = useAdminAuth();

  const copyAll = () => {
    const text = subscribers.map((s) => s.email).join(", ");
    if (text) navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-light tracking-wide">{t("admin.subscribers.title")}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t("admin.subscribers.subtitle")}</p>
        </div>
        {subscribers.length > 0 && (
          <button onClick={copyAll} className="border bg-white px-4 py-2.5 text-sm hover:border-black">{t("admin.subscribers.copyAll")}</button>
        )}
      </div>

      <div className="bg-white shadow-sm mt-6 overflow-x-auto">
        {subscribers.length === 0 ? (
          <p className="px-5 py-10 text-neutral-500 text-sm">{t("admin.subscribers.empty")}</p>
        ) : (
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-neutral-500 border-b">
                <th className="px-5 py-3 font-medium">{t("admin.subscribers.thEmail")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.subscribers.thDate")}</th>
                <th className="px-5 py-3 font-medium text-right">{t("admin.subscribers.thActions")}</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.email} className="border-b last:border-0 hover:bg-neutral-50">
                  <td className="px-5 py-3 align-top font-medium">{s.email}</td>
                  <td className="px-5 py-3 align-top">{new Date(s.date).toLocaleString(locale)}</td>
                  <td className="px-5 py-3 align-top text-right">
                    <button onClick={() => { if (confirm(t("admin.subscribers.deleteConfirm", { email: s.email }))) { deleteSubscriber(s.email); logActivity(user?.email, "Xoá email đăng ký", `Xoá ${s.email}.`); } }} className="underline text-red-600">{t("common.delete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
