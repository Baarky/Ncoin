import { pool } from "../config/db.js";

export const createReportTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS reports ( 
      id SERIAL PRIMARY KEY, 
      reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, 
      reason TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    );
  `;

  await pool.query(query);
};