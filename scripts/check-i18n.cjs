/* Kiểm tra bao phủ từ điển i18n (v16).
   Cách dùng: node scripts/check-i18n.cjs
   - Biên dịch src/lib/i18n (chỉ còn 2 ngôn ngữ bundle sẵn vi/en)
     sang JS tạm bằng tsc của dự án, rồi so 2 từ điển với nhau.
   - Mỗi ngôn ngữ phải: parse được, đủ số khóa (bằng nhau), không
     thừa khóa, không có giá trị rỗng, giữ nguyên mọi {placeholder}
     của bản tiếng Anh.
   - Thoát 1 khi có lỗi (thiếu khóa, thừa khóa, rỗng, lệch
     placeholder, hoặc file lỗi cú pháp); thoát 0 khi sạch.
   - Lịch sử: v7–v15 kiểm tra 132 file từ điển ở
     src/lib/i18n/dictionaries/; từ v16 chỉ còn vi + en nên
     dictionaries/ đã bị xóa và script này chỉ kiểm tra 2 ngôn ngữ
     bundle sẵn. */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(__dirname, "..", ".i18n-check-tmp");

function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? prefix + "." + k : k;
    if (typeof v === "string") out[p] = v;
    else if (v && typeof v === "object") flatten(v, p, out);
    else out[p] = v;
  }
  return out;
}

function placeholders(s) {
  const m = String(s).match(/\{(\w+)\}/g);
  return m ? [...m].sort().join(",") : "";
}

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  try {
    execSync(
      `npx tsc src/lib/i18n/index.ts src/lib/i18n/bundled.ts src/lib/i18n/dictionary.ts src/lib/i18n/languages.ts src/lib/i18n/loader.ts --outDir "${OUT}" --module commonjs --target es2020 --esModuleInterop --skipLibCheck --declaration false`,
      { cwd: ROOT, stdio: "pipe" },
    );
  } catch (e) {
    console.log("tsc failed — some i18n file has a syntax/type error:");
    console.log((e.stdout || Buffer.from("")).toString());
    console.log((e.stderr || Buffer.from("")).toString());
    process.exit(1);
  }

  const bundled = require(path.join(OUT, "bundled.js"));
  const refVi = flatten(bundled.vi, "", {});
  const refEn = flatten(bundled.en, "", {});
  const keysVi = Object.keys(refVi).sort();
  const keysEn = Object.keys(refEn).sort();
  console.log(`canonical keys (vi): ${keysVi.length}, (en): ${keysEn.length}`);

  let failures = 0;
  const summary = [];
  for (const [code, flat, other] of [
    ["vi", refVi, refEn],
    ["en", refEn, refVi],
  ]) {
    const got = Object.keys(flat).sort();
    const otherKeys = Object.keys(other);
    const missing = otherKeys.filter((k) => !(k in flat));
    const extra = got.filter((k) => !(k in other));
    const empty = got.filter((k) => typeof flat[k] !== "string" || flat[k] === "");
    const badPlaceholders = got.filter(
      (k) => k in refEn && placeholders(flat[k]) !== placeholders(refEn[k]),
    );
    const identicalToEn = code === "vi"
      ? got.filter((k) => k in refEn && flat[k] === refEn[k])
      : 0;
    const status =
      missing.length === 0 &&
      extra.length === 0 &&
      empty.length === 0 &&
      badPlaceholders.length === 0
        ? "OK"
        : "FAIL";
    if (status === "FAIL") failures++;
    summary.push(
      `${code.padEnd(7)} ${status} keys=${got.length} missing=${missing.length} extra=${extra.length} empty=${empty.length} badPlaceholders=${badPlaceholders.length} identicalToEn=${identicalToEn}`,
    );
    if (missing.length) console.log(`  [${code}] missing: ${missing.join(", ")}`);
    if (extra.length) console.log(`  [${code}] extra: ${extra.join(", ")}`);
    if (empty.length) console.log(`  [${code}] empty: ${empty.join(", ")}`);
    if (badPlaceholders.length)
      console.log(`  [${code}] bad placeholders: ${badPlaceholders.join(", ")}`);
  }
  console.log("\n" + summary.join("\n"));
  console.log(`\n${failures === 0 ? "PASS" : "FAIL"}: ${failures} language(s) with problems`);
  fs.rmSync(OUT, { recursive: true, force: true });
  process.exit(failures === 0 ? 0 : 1);
}

main();
