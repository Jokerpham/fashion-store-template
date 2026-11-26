/* Từ điển VI + EN được bundle sẵn (gộp từ các section). Tách riêng file
   này để loader.ts dùng được mà không tạo import vòng với index.ts. */
import type { Dictionary } from "./dictionary";
export type { Dictionary } from "./dictionary";
import { common } from "./sections/common";
import { shop } from "./sections/shop";
import { admin } from "./sections/admin";

function merge(
  ...sections: { vi: Dictionary; en: Dictionary }[]
): { vi: Dictionary; en: Dictionary } {
  const vi: Dictionary = {};
  const en: Dictionary = {};
  for (const s of sections) {
    Object.assign(vi, s.vi);
    Object.assign(en, s.en);
  }
  return { vi, en };
}

const merged = merge(common, shop, admin);
export const vi = merged.vi;
export const en = merged.en;
