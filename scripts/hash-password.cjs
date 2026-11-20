/* Tạo salt + hash mật khẩu theo đúng công thức dùng phía server
   (src/lib/auth.ts): SHA-256 hex của chuỗi "salt:password" (UTF-8),
   salt là 16 byte ngẫu nhiên viết dạng hex (32 ký tự).
   Dùng để tạo sẵn hash cho tài khoản demo trong các file SQL seed
   (fashion-store-d1-insert.sql, prisma/seed.cjs, database seed.sql).
   Cách chạy: node scripts/hash-password.cjs <mat-khau> [salt-hex]
   Không truyền salt thì script tự sinh salt ngẫu nhiên. */
const crypto = require("crypto");

function hashPassword(password, salt) {
  return crypto.createHash("sha256").update(`${salt}:${password}`, "utf8").digest("hex");
}

const [, , password, saltArg] = process.argv;
if (!password) {
  console.error("Cách dùng: node scripts/hash-password.cjs <mat-khau> [salt-hex]");
  process.exit(1);
}
const salt = saltArg || crypto.randomBytes(16).toString("hex");
const hash = hashPassword(password, salt);
console.log(`password: ${password}`);
console.log(`salt: ${salt}`);
console.log(`password_hash: ${hash}`);
