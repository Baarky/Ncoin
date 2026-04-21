import { pool } from "../config/db.js";
import { addExp } from "./exp.service.js";

export const createQuest = async (title, description, rewardCoin, rewardExp, userId) => {
  const result = await pool.query(
    `INSERT INTO quests (title, description, reward_coin, reward_exp, created_by, is_approved)
     VALUES ($1, $2, $3, $4, $5, false)
     RETURNING *`,
    [title, description, rewardCoin, rewardExp, userId]
  );
  return result.rows[0];
};

// 承認済みクエストのみ返す
export const getQuests = async (userId) => {
  const result = await pool.query(
    `SELECT 
       q.id,
       q.title,
       q.description,
       q.reward_coin,
       q.reward_exp,
       q.created_at,
       u.username AS created_by_username,
       CASE 
         WHEN qp.id IS NOT NULL THEN true
         ELSE false
       END AS is_completed
     FROM quests q
     JOIN users u ON q.created_by = u.id
     LEFT JOIN quest_progress qp
       ON q.id = qp.quest_id AND qp.user_id = $1
     WHERE q.is_approved = true
     ORDER BY q.created_at DESC`,
    [userId]
  );
  return result.rows;
};

// 自分が申請したクエスト（承認状態も含む）
export const getMyCreatedQuests = async (userId) => {
  const result = await pool.query(
    `SELECT id, title, description, reward_coin, reward_exp, is_approved, created_at
     FROM quests
     WHERE created_by = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const completeQuest = async (userId, questId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const questResult = await client.query(
      `SELECT * FROM quests WHERE id = $1 AND is_approved = true`,
      [questId]
    );
    const quest = questResult.rows[0];
    if (!quest) throw new Error("Quest not found");

    const progressResult = await client.query(
      `SELECT * FROM quest_progress WHERE user_id = $1 AND quest_id = $2`,
      [userId, questId]
    );
    if (progressResult.rows.length > 0) throw new Error("Already completed");

    await client.query(
      `UPDATE users SET coin = coin + $1 WHERE id = $2`,
      [quest.reward_coin, userId]
    );
    await addExp(client, userId, quest.reward_exp);

    await client.query(
      `INSERT INTO quest_progress (user_id, quest_id) VALUES ($1, $2)`,
      [userId, questId]
    );

    await client.query("COMMIT");
    return { message: "quest completed", reward: quest.reward_coin };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getMyQuests = async (userId) => {
  const result = await pool.query(
    `SELECT 
       q.id, q.title, q.description, q.reward_coin, q.reward_exp, qp.completed_at
     FROM quest_progress qp
     JOIN quests q ON qp.quest_id = q.id
     WHERE qp.user_id = $1
     ORDER BY qp.completed_at DESC`,
    [userId]
  );
  return result.rows;
};