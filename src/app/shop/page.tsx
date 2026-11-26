"use client";
import { useEffect, useMemo, useState } from "react";
import { useProducts } from "@/lib/store";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { categoryLabel } from "@/lib/i18n";
const cats=[{id:"all"},{id:"woman"},{id:"man"},{id:"accessories"},{id:"bags"},{id:"footwear"}];
export default function ShopPage(){
  const { products } = useProducts();
  const { lang, t } = useLanguage();
  const [cat,setCat]=useState("all"); const [q,setQ]=useState(""); const [sort,setSort]=useState("default");
  // Nhận từ khóa từ ô tìm kiếm trên header (?q=...) khi trang vừa mở
  useEffect(()=>{ const v=new URLSearchParams(window.location.search).get("q"); if(v) setQ(v); },[]);
  const list=useMemo(()=>{ let l=products.filter(p=>(cat==="all"||p.category===cat)&&p.name.toLowerCase().includes(q.toLowerCase())); if(sort==="asc") l=[...l].sort((a,b)=>a.price-b.price); if(sort==="desc") l=[...l].sort((a,b)=>b.price-a.price); return l; },[cat,q,sort,products]);
  return (<div className="bg-white pt-12 container-x pb-20">
    <h1 className="text-3xl font-light tracking-widest text-center">{t("nav.shop")}</h1>
    <div className="flex flex-wrap gap-3 justify-between items-center mt-10">
      <div className="flex gap-2 flex-wrap">{cats.map(c=><button key={c.id} onClick={()=>setCat(c.id)} className={cat===c.id?"bg-black text-white px-4 py-2 text-sm":"border px-4 py-2 text-sm"}>{c.id==="all"?t("common.all"):categoryLabel(c.id, lang)}</button>)}</div>
      <div className="flex gap-3"><input value={q} onChange={e=>setQ(e.target.value)} placeholder={t("shop.searchPlaceholder")} className="border px-3 py-2 text-sm" /><select value={sort} onChange={e=>setSort(e.target.value)} className="border px-3 py-2 text-sm"><option value="default">{t("shop.sortDefault")}</option><option value="asc">{t("shop.sortAsc")}</option><option value="desc">{t("shop.sortDesc")}</option></select></div>
    </div>
    {list.length===0 ? <p className="text-center text-neutral-500 mt-16">{t("shop.empty")}</p> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">{list.map(p=><ProductCard key={p.id} product={p} />)}</div>}
  </div>);
}
