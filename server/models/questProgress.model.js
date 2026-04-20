import { pool } from "../config/db.js";


export const createQuestProgressTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS quest_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      quest_id INTEGER,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(query);
};