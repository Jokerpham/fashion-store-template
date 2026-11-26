-- Fashion Store — migration: bảng payments (thanh toán online)
-- Chạy 1 lần vào D1 (thật hoặc local) để thêm bảng payments cho các đơn
-- đã có trước đó. Database mới thì chỉ cần chạy fashion-store-d1-create.sql
-- (đã gồm bảng này). Chạy trong D1 console của Cloudflare hoặc từ thư
-- mục project:
--   npx wrangler d1 execute fashion-store --local --file=fashion-store-d1-payments-migration.sql
--   npx wrangler d1 execute fashion-store --remote --file=fashion-store-d1-payments-migration.sql
CREATE TABLE IF NOT EXISTS "payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order_code" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "gateway_ref" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "raw_payload" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payments_order_code_key" UNIQUE ("order_code")
);
CREATE UNIQUE INDEX IF NOT EXISTS "payments_order_code_key" ON "payments"("order_code");
CREATE INDEX IF NOT EXISTS "payments_gateway_gateway_ref_idx" ON "payments"("gateway", "gateway_ref");
