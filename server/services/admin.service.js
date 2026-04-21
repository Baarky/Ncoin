import { pool } from "../config/db.js";

export const getReports = async () => {
  const result = await pool.query(
    `SELECT 
       r.id, r.reason, r.status, r.created_at,
       u1.username AS reporter_username,
       u2.username AS target_username,
       u2.id AS target_user_id
     FROM reports r
     JOIN users u1 ON r.reporter_id = u1.id
     JOIN users u2 ON r.target_user_id = u2.id
     ORDER BY r.created_at DESC`
  );
  return result.rows;
};

export const banUser = async (userId) => {
  await pool.query(`UPDATE users SET is_banned = true WHERE id = $1`, [userId]);
};

export const unbanUser = async (userId) => {
  await pool.query(`UPDATE users SET is_banned = false WHERE id = $1`, [userId]);
};

export const updateReportStatus = async (reportId, status) => {
  const result = await pool.query(
    `UPDATE reports SET status = $1 WHERE id = $2 RETURNING *`,
    [status, reportId]
  );
  return result.rows[0];
};

// 全ユーザー一覧
export const getAllUsers = async () => {
  const result = await pool.query(
    `SELECT id, username, coin, exp, level, is_admin, is_banned, created_at
     FROM users
     ORDER BY created_at DESC`
  );
  return result.rows;
};

// コイン配布/没収
export const giveCoins = async (userId, amount) => {
  const result = await pool.query(
    `UPDATE users SET coin = coin + $1 WHERE id = $2 RETURNING id, username, coin`,
    [amount, userId]
  );
  return result.rows[0];
};

// クエスト承認
export const approveQuest = async (questId) => {
  const result = await pool.query(
    `UPDATE quests SET is_approved = true WHERE id = $1 RETURNING *`,
    [questId]
  );
  return result.rows[0];
};

// 未承認クエスト一覧
export const getPendingQuests = async () => {
  const result = await pool.query(
    `SELECT q.id, q.title, q.description, q.reward_coin, q.reward_exp, q.created_at,
            u.username AS created_by_username
     FROM quests q
     JOIN users u ON q.created_by = u.id
     WHERE q.is_approved = false
     ORDER BY q.created_at DESC`
  );
  return result.rows;
};