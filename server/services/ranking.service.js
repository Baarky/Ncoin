import { pool } from "../config/db.js";

export const getRanking = async () => {
  const result = await pool.query(
    `SELECT 
       username,
       exp,
       level,
       coin,
       RANK() OVER (ORDER BY exp DESC) as rank
     FROM users
     ORDER BY exp DESC
     LIMIT 50`
  );

  return result.rows;
};