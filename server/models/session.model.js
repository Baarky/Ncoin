import { pool } from "../config/db.js";
// セッションテーブルの作成

export const createSessionTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS sessions ( 
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, 
      token TEXT NOT NULL, 
      expires_at TIMESTAMP NOT NULL, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(query);
};