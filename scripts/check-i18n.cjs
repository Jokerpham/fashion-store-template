/* Kiểm tra bao phủ từ điển i18n (v7).
   Cách dùng: node scripts/check-i18n.cjs
   - Biên dịch src/lib/i18n (kèm toàn bộ dictionaries/*.ts) sang JS tạm
     bằng tsc của dự án, rồi nạp từng từ điển và so với bộ khóa chuẩn
     (từ điển vi/en gộp trong bundled.ts).
   - Mỗi ngôn ngữ phải: parse được, đủ 688 khóa, không thừa khóa, không
     có giá trị rỗng, giữ nguyên mọi {placeholder} của bản tiếng Anh.
   - Báo cáo thêm số khóa còn giống hệt tiếng Anh (để tham khảo — một
     phần là cố ý: tên thương hiệu, "COMING SOON", ₫, mã coupon...).
   - Thoát 1 khi có lỗi (thiếu khóa, thừa khóa, rỗng, lệch placeholder,
     hoặc file lỗi cú pháp); thoát 0 khi sạch. */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(__dirname, "..", ".i18n-check-tmp");
const DICT_DIR = path.join(ROOT, "src", "lib", "i18n", "dictionaries");

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
      `npx tsc src/lib/i18n/index.ts src/lib/i18n/bundled.ts src/lib/i18n/dictionary.ts src/lib/i18n/languages.ts src/lib/i18n/loader.ts src/lib/i18n/dictionaries/*.ts --outDir "${OUT}" --module commonjs --target es2020 --esModuleInterop --skipLibCheck --declaration false`,
      { cwd: ROOT, stdio: "pipe" },
    );
  } catch (e) {
    console.log("tsc failed — some dictionary file has a syntax/type error:");
    console.log((e.stdout || Buffer.from("")).toString());
    console.log((e.stderr || Buffer.from("")).toString());
    process.exit(1);
  }

  const bundled = require(path.join(OUT, "bundled.js"));
  const refVi = flatten(bundled.vi, "", {});
  const refEn = flatten(bundled.en, "", {});
  const keys = Object.keys(refVi).sort();
  console.log(`canonical keys (vi): ${keys.length}, (en): ${Object.keys(refEn).length}`);

  const files = fs
    .readdirSync(DICT_DIR)
    .filter((f) => f.endsWith(".ts"))
    .sort();
  console.log(`dictionary files: ${files.length}`);

  let failures = 0;
  const summary = [];
  for (const f of files) {
    const code = f.replace(/\.ts$/, "");
    let mod;
    try {
      mod = require(path.join(OUT, "dictionaries", code + ".js"));
    } catch (e) {
      console.log(`\n[${code}] REQUIRE FAILED: ${e.message}`);
      failures++;
      continue;
    }
    const dict = mod && mod.default;
    if (!dict || typeof dict !== "object") {
      console.log(`\n[${code}] no default export object`);
      failures++;
      continue;
    }
    const flat = flatten(dict, "", {});
    const got = Object.keys(flat).sort();
    const missing = keys.filter((k) => !(k in flat));
    const extra = got.filter((k) => !(k in refVi));
    const empty = got.filter((k) => typeof flat[k] !== "string" || flat[k] === "");
    const badPlaceholders = got.filter(
      (k) => k in refEn && placeholders(flat[k]) !== placeholders(refEn[k]),
    );
    const identicalToEn = got.filter((k) => k in refEn && flat[k] === refEn[k]);
    const status =
      missing.length === 0 &&
      extra.length === 0 &&
      empty.length === 0 &&
      badPlaceholders.length === 0
        ? "OK"
        : "FAIL";
    if (status === "FAIL") failures++;
    summary.push(
      `${code.padEnd(7)} ${status} keys=${got.length} missing=${missing.length} extra=${extra.length} empty=${empty.length} badPlaceholders=${badPlaceholders.length} identicalToEn=${identicalToEn.length}`,
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
