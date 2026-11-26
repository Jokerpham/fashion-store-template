"use client";
/* Nhật ký hoạt động hệ thống — MỨC DEMO, LƯU TRÊN TRÌNH DUYỆT.
   Mỗi trình duyệt giữ một nhật ký riêng (key fashion-activity-log), không
   đồng bộ sang máy khác và không ghi được thao tác làm trực tiếp trong
   CSDL. Chỉ tài khoản admin xem được trang này. */
import { useEffect, useState } from "react";
import { clearActivityLog, readActivityLog, type ActivityEntry } from "@/lib/activity";
import { useLanguage } from "@/context/LanguageContext";
import { localeForLang } from "@/lib/i18n";

export default function AdminActivity() {
  const { lang, t } = useLanguage();
  const locale = localeForLang(lang);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    setEntries(readActivityLog());
  }, []);

  const clear = () => {
    if (!confirm(t("admin.activity.clearConfirm"))) return;
    clearActivityLog();
    setEntries([]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-light tracking-wide">{t("admin.activity.title")}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {t("admin.activity.subtitle")}
          </p>
        </div>
        {entries.length > 0 && (
          <button onClick={clear} className="border bg-white px-4 py-2.5 text-sm text-red-600 hover:border-red-600">
            {t("admin.activity.clear")}
          </button>
        )}
      </div>

      <div className="bg-white shadow-sm mt-6 overflow-x-auto">
        {entries.length === 0 ? (
          <p className="px-5 py-10 text-neutral-500 text-sm">
            {t("admin.activity.empty")}
          </p>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-neutral-500 border-b">
                <th className="px-5 py-3 font-medium">{t("admin.activity.thTime")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.activity.thAccount")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.activity.thAction")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.activity.thDetail")}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-neutral-50">
                  <td className="px-5 py-3 align-top whitespace-nowrap">
                    {new Date(e.time).toLocaleString(locale)}
                  </td>
                  <td className="px-5 py-3 align-top break-all">{e.email}</td>
                  <td className="px-5 py-3 align-top font-medium whitespace-nowrap">{e.action}</td>
                  <td className="px-5 py-3 align-top">{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
