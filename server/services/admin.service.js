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
// クエスト削除
export const deleteQuest = async (questId) => {
  // クエスト作成時に消費したcoinを返還
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const questResult = await client.query(
      `SELECT * FROM quests WHERE id = $1`,
      [questId]
    );
    const quest = questResult.rows[0];
    if (!quest) throw new Error("Quest not found");

    // 公式クエストでない場合のみcoin返還
    if (!quest.is_official && quest.created_by) {
      await client.query(
        `UPDATE users SET coin = coin + $1 WHERE id = $2`,
        [quest.reward_coin, quest.created_by]
      );
    }

    await client.query(`DELETE FROM quest_progress WHERE quest_id = $1`, [questId]);
    await client.query(`DELETE FROM quests WHERE id = $1`, [questId]);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// 公式クエスト作成
export const createOfficialQuest = async (title, description, rewardCoin, rewardExp) => {
  const result = await pool.query(
    `INSERT INTO quests (title, description, reward_coin, reward_exp, reward_exp_custom, is_approved, is_official, created_by)
     VALUES ($1, $2, $3, $4, $4, true, true, NULL)
     RETURNING *`,
    [title, description, rewardCoin, rewardExp]
  );
  return result.rows[0];
};
export const getQuests = async (userId) => {
  const result = await pool.query(
    `SELECT 
       q.id, q.title, q.description, q.reward_coin, q.reward_exp,
       q.reward_exp_custom, q.is_official,
       q.created_at, q.created_by,
       u.username AS created_by_username,
       CASE WHEN qp.id IS NOT NULL THEN true ELSE false END AS is_completed,
       qp.completer_approved,
       qp.creator_approved
     FROM quests q
     LEFT JOIN users u ON q.created_by = u.id
     LEFT JOIN quest_progress qp ON q.id = qp.quest_id AND qp.user_id = $1
     WHERE q.is_approved = true
     ORDER BY q.is_official DESC, q.created_at DESC`,
    [userId]
  );
  return result.rows;
};