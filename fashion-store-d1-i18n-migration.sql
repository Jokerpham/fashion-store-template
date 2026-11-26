-- Fashion Store v6 — migration đa ngôn ngữ: thêm tên / mô tả tiếng Anh
-- cho bảng products. Chạy 1 lần trên D1 đã có dữ liệu (local + live):
--   npx wrangler d1 execute fashion-store --local  --file=fashion-store-d1-i18n-migration.sql
--   npx wrangler d1 execute fashion-store --remote --file=fashion-store-d1-i18n-migration.sql
-- (Bảng mới tạo từ fashion-store-d1-create.sql đã có sẵn 2 cột này.)
-- Chỉ chạy 1 lần trên mỗi database. Chạy lại thì 2 lệnh ALTER sẽ báo lỗi
-- "duplicate column" (cột đã tồn tại) — đó là bình thường, không sao cả;
-- các lệnh UPDATE bên dưới đều có điều kiện name_en IS NULL nên an toàn.
ALTER TABLE products ADD COLUMN name_en TEXT;
ALTER TABLE products ADD COLUMN description_en TEXT;

-- Điền tên / mô tả tiếng Anh cho 8 sản phẩm mẫu (chỉ cập nhật hàng nào
-- chưa có bản tiếng Anh, để không ghi đè dữ liệu admin đã sửa).
UPDATE products SET name_en = 'Guide Pack Cap', description_en = 'Minimalist baseball cap in breathable cotton — fits every outfit.' WHERE id = 1 AND name_en IS NULL;
UPDATE products SET name_en = 'Blue Raincoat', description_en = 'Long pastel-blue coat with a relaxed, elegant cut for spring.' WHERE id = 2 AND name_en IS NULL;
UPDATE products SET name_en = 'Cotton Jacket', description_en = 'Soft beige cotton jacket, easy to style — the finishing touch for a minimalist outfit.' WHERE id = 3 AND name_en IS NULL;
UPDATE products SET name_en = 'Crewneck Blouse', description_en = 'Classic crewneck blouse with a clean, effortless silhouette.' WHERE id = 4 AND name_en IS NULL;
UPDATE products SET name_en = 'Eather Trainers', description_en = 'Nude trainers with a cushioned sole, Korean minimalist style.' WHERE id = 5 AND name_en IS NULL;
UPDATE products SET name_en = 'Cotton T-shirt', description_en = 'Peach cotton T-shirt, 26% off — a summer must-have.' WHERE id = 6 AND name_en IS NULL;
UPDATE products SET name_en = 'Azure Tote', description_en = 'Black tote with gold handles, 20% off — fits a 14-inch laptop.' WHERE id = 7 AND name_en IS NULL;
UPDATE products SET name_en = 'Classic Topper', description_en = 'Classic long black coat, timeless and easy to style.' WHERE id = 8 AND name_en IS NULL;
