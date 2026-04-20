import { pool } from "../config/db.js";

export const createReport = async (reporterId, targetUserId, reason) => {
  const result = await pool.query(
    `INSERT INTO reports (reporter_id, target_user_id, reason)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [reporterId, targetUserId, reason]
  );

  return result.rows[0];
};