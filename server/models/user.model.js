import { pool } from "../config/db.js";
// ユーザーテーブルの作成

export const createUserTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, -- ユーザーID
      username VARCHAR(50) UNIQUE NOT NULL, --ユーザー名
      password TEXT NOT NULL, -- パスワード（ハッシュ化して保存）
      coin INTEGER DEFAULT 0, 
      exp INTEGER DEFAULT 0, 
      level INTEGER DEFAULT 1, 
      is_admin BOOLEAN DEFAULT false, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(query);
};