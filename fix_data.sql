
-- 既存のテストユーザーを削除
DELETE FROM users WHERE email = 'test@example.com';
DELETE FROM users WHERE email = 'admin@example.com';
DELETE FROM admins WHERE email = 'admin@example.com';

-- 正しいハッシュ値で再登録
INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES ('user-1', 'test@example.com', '$2a$10$2aidNGKUFbDjexVSMU/XXurBN8qUVweC0cVLK8eNAXC/v4CBtlds2', 0, 0);
INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES ('admin-1', 'admin@example.com', '$2a$10$2aidNGKUFbDjexVSMU/XXurBN8qUVweC0cVLK8eNAXC/v4CBtlds2', 0, 0);
INSERT INTO admins (email) VALUES ('admin@example.com');