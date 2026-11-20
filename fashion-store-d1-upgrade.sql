-- Nâng cấp database D1 fashion-store lên bản đăng nhập phía máy chủ.
-- Chạy 1 lần trên database ĐANG CHẠY (remote) TRƯỚC khi đẩy code mới lên.
-- Cách chạy (trong thư mục dự án, Git Bash):
--   npx wrangler d1 execute fashion-store --remote --file=fashion-store-d1-upgrade.sql
-- Sau đó chạy lại file seed để nạp lại tài khoản demo + dữ liệu mẫu:
--   npx wrangler d1 execute fashion-store --remote --file=fashion-store-d1-insert.sql

-- 1) Thêm cột salt cho bảng users (mật khẩu băm SHA-256 cần salt riêng).
ALTER TABLE users ADD COLUMN salt TEXT NOT NULL DEFAULT '';

-- 2) Bảng phiên đăng nhập (sessions) — cookie chỉ chứa token, server kiểm tra ở đây.
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  scope TEXT NOT NULL DEFAULT 'shop',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

-- 3) Xoá tài khoản demo cũ (nếu có) để file insert nạp lại đúng hash mới.
--    Tài khoản demo cũ lưu hash kiểu cũ, không đăng nhập được với code mới.
DELETE FROM users WHERE email IN ('demo@store.local', 'admin@store.local');

-- 4) Nạp lại 2 tài khoản demo với hash SHA-256 + salt mới.
--    demo@store.local / demo123 (khách), admin@store.local / admin123 (quản trị).
INSERT INTO users (name, email, password_hash, salt, role, phone, created_at, updated_at) VALUES
  ('Khách Demo', 'demo@store.local', '80a78571ac81446d553dcd3e67ff4242ef102e08c3bfc8d80e4cd50c0e601d32', '3b5223c4a48c932e746d80e5d36db7b5', 'customer', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Quản trị viên', 'admin@store.local', '38d3c130c9d68273e66160cbf0daa3db0c6af2c56594b5b93b7580eb5fa89d76', '2fa40939224643c6228da7a341b9ec1c', 'admin', '0123456789', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(email) DO NOTHING;
