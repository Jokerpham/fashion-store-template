"use client";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
export default function PromoCards(){
  const { t } = useLanguage();
  const cards=[
    {title:t("home.promoShoes"),img:"/images/site/promo-shoes.jpg"},
    {title:t("home.promoSale"),img:"/images/site/promo-sale.jpg"},
    {title:t("home.promoSummer"),img:"/images/site/promo-summer.jpg"},
  ];
  return (<section className="grid md:grid-cols-3">
    {cards.map((c,i)=>(<div key={i} className="relative h-44 bg-[#f2f2f2] overflow-hidden flex items-center">
      <div className="pl-8 z-10"><h3 className="text-xl font-light whitespace-pre-line leading-tight">{c.title}</h3><Link href="/shop" className="text-[11px] tracking-[0.2em] underline underline-offset-4 mt-3 inline-block">{t("misc.viewNow")}</Link></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.img} alt={c.title} className="absolute right-0 top-0 h-full w-1/2 object-cover" />
    </div>))}
  </section>);
}
