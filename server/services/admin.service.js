import { pool } from "../config/db.js";

// 通報一覧取得
export const getReports = async () => {
  const result = await pool.query(
    `SELECT 
       r.id,
       r.reason,
       r.status,
       r.created_at,
       u1.username AS reporter_username,
       u2.username AS target_username
     FROM reports r
     JOIN users u1 ON r.reporter_id = u1.id
     JOIN users u2 ON r.target_user_id = u2.id
     ORDER BY r.created_at DESC`
  );

  return result.rows;
};
// ユーザーBAN
export const banUser = async (userId) => {
  await pool.query(
    `UPDATE users SET is_banned = true WHERE id = $1`,
    [userId]
  );
};
export const updateReportStatus = async (reportId, status) => {
  const result = await pool.query(
    `UPDATE reports 
     SET status = $1 
     WHERE id = $2
     RETURNING *`,
    [status, reportId]
  );

  return result.rows[0];
};