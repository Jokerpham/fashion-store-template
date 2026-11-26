"use client";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

type EventItem = {
  day: string;
  title: string;
  time: string;
  place: string;
  desc: string;
  source: string;
  sourceLabel: string;
};

export default function CuoiTuanPage() {
  const { t } = useLanguage();
  const events: EventItem[] = [
    {
      day: t("weekend.saturday"),
      title: "Saigon Beauty Show 2026 & K-Beauty Expo Vietnam",
      time: "10:00–17:00",
      place: "SECC, 799 Nguyễn Văn Linh, Tân Mỹ, TP.HCM",
      desc: t("weekend.event1Desc"),
      source: "https://cityhousebooking.com/en/october-2026-events-ho-chi-minh-city",
      sourceLabel: t("weekend.event1Source"),
    },
    {
      day: t("weekend.saturday"),
      title: t("weekend.event2Title"),
      time: "10:00–16:00",
      place: "SECC, 799 Nguyễn Văn Linh, Tân Mỹ, TP.HCM",
      desc: t("weekend.event2Desc"),
      source: "https://cityhousebooking.com/en/october-2026-events-ho-chi-minh-city",
      sourceLabel: t("weekend.event1Source"),
    },
    {
      day: t("weekend.allWeekend"),
      title: "Chợ Tân Bình",
      time: "07:00–17:30",
      place: "172 Lý Thường Kiệt, Tân Bình, TP.HCM",
      desc: t("weekend.event3Desc"),
      source: "https://vietpowertravel.com/blog/ho-chi-minh-clothes-market.html",
      sourceLabel: t("weekend.event3Source"),
    },
    {
      day: t("weekend.saturday"),
      title: t("weekend.event4Title"),
      time: t("weekend.event4Time"),
      place: "142 Trần Não, An Khánh, Thủ Đức, TP.HCM",
      desc: t("weekend.event4Desc"),
      source: "https://allevents.in/ho-chi-minh-city/november",
      sourceLabel: t("weekend.event4Source"),
    },
    {
      day: t("weekend.sunday"),
      title: "PIANO RECITAL: The Warsaw Concerto",
      time: "19:00",
      place: t("weekend.event5Place"),
      desc: t("weekend.event5Desc"),
      source: "https://allevents.in/ho-chi-minh-city/november",
      sourceLabel: t("weekend.event4Source"),
    },
  ];

  return (
    <div className="bg-white">
      <section className="container-x pt-14 pb-10">
        <p className="text-[13px] font-medium tracking-[0.25em] text-neutral-500">
          {t("weekend.eyebrow")}
        </p>
        <h1 className="font-heading font-light text-4xl md:text-5xl tracking-wide mt-4">
          {t("weekend.title")}
        </h1>
        <p className="text-neutral-500 mt-4 text-[15px] leading-relaxed max-w-2xl">
          {t("weekend.intro")}
        </p>
      </section>

      <section className="container-x pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => (
            <article key={ev.title} className="bg-white border shadow-sm p-6 flex flex-col">
              <p className="text-[12px] font-semibold tracking-[0.2em] text-neutral-500">
                {ev.day.toUpperCase()}
              </p>
              <h2 className="font-heading font-semibold text-[19px] leading-snug mt-3">
                {ev.title}
              </h2>
              <p className="text-[15px] mt-4">
                <span className="font-medium">{t("weekend.timeLabel")}</span>
                {ev.time}
              </p>
              <p className="text-[15px] mt-1">
                <span className="font-medium">{t("weekend.placeLabel")}</span>
                {ev.place}
              </p>
              <p className="text-neutral-600 text-[15px] leading-relaxed mt-3 flex-1">
                {ev.desc}
              </p>
              <a
                href={ev.source}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline mt-5 hover:text-black"
              >
                {t("weekend.viewSource")} {ev.sourceLabel} →
              </a>
            </article>
          ))}

          <article className="bg-[#171a21] text-white p-6 flex flex-col shadow-sm">
            <p className="text-[12px] font-semibold tracking-[0.2em] text-neutral-300">
              {t("weekend.suggestionEyebrow")}
            </p>
            <h2 className="font-heading font-semibold text-[19px] leading-snug mt-3">
              {t("weekend.suggestionTitle")}
            </h2>
            <p className="text-neutral-300 text-[15px] leading-relaxed mt-4 flex-1">
              {t("weekend.suggestionText")}
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-block bg-white text-black px-6 py-3 text-sm font-semibold text-center hover:bg-neutral-200 transition"
            >
              {t("weekend.visitShop")}
            </Link>
          </article>
        </div>

        <p className="text-xs text-neutral-500 mt-8 leading-relaxed max-w-3xl">
          {t("weekend.note")}
        </p>

        <div className="flex flex-wrap gap-4 mt-10">
          <Link
            href="/"
            className="bg-[#171a21] text-white px-8 py-3.5 text-sm tracking-[0.2em] hover:bg-black transition"
          >
            {t("misc.backHome")}
          </Link>
          <Link
            href="/shop"
            className="border border-black px-8 py-3.5 text-sm tracking-[0.2em] hover:bg-black hover:text-white transition"
          >
            {t("weekend.visitShop")}
          </Link>
        </div>
      </section>
    </div>
  );
}
