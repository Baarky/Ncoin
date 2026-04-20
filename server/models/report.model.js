import { pool } from "../config/db.js";
// 報告テーブルの作成

export const createReportTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS reports ( 
      id SERIAL PRIMARY KEY, 
      reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, 
      reason TEXT NOT NULL, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    );
  `;

  await pool.query(query);
};