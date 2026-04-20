import { pool } from "../config/db.js";
// クエストテーブルの作成

export const createQuestTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS quests (
      id SERIAL PRIMARY KEY, 
      title VARCHAR(100) NOT NULL, 
      description TEXT, 
      reward_coin INTEGER DEFAULT 0, 
      reward_exp INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, 
      is_approved BOOLEAN DEFAULT false, 
      is_completed BOOLEAN DEFAULT false, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    );
  `;

  await pool.query(query);
};