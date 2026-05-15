import { pool } from "../config/db.js";

export const getUserProfile = async (username) => {
  // ユーザー基本情報
  const userResult = await pool.query(
    `SELECT id, username, coin, exp, level, created_at
     FROM users WHERE username = $1`,
    [username]
  );
  const user = userResult.rows[0];
  if (!user) throw new Error("User not found");

  // 作成したクエスト数
  const createdCountResult = await pool.query(
    `SELECT COUNT(*) FROM quests WHERE created_by = $1`,
    [user.id]
  );

  // 達成したクエスト数
  const completedCountResult = await pool.query(
    `SELECT COUNT(*) FROM quest_progress 
     WHERE user_id = $1 AND creator_approved = true`,
    [user.id]
  );

  // 作成したクエスト一覧
  const createdQuestsResult = await pool.query(
    `SELECT id, title, description, reward_coin, reward_exp_custom,
            is_approved, is_official, created_at
     FROM quests WHERE created_by = $1
     ORDER BY created_at DESC`,
    [user.id]
  );

  return {
    username: user.username,
    coin: user.coin,
    exp: user.exp,
    level: user.level,
    created_at: user.created_at,
    created_quest_count: parseInt(createdCountResult.rows[0].count),
    completed_quest_count: parseInt(completedCountResult.rows[0].count),
    created_quests: createdQuestsResult.rows
  };
};