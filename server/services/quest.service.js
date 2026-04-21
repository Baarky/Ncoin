import { pool } from "../config/db.js";
import { addExp } from "./exp.service.js";

export const createQuest = async (title, description, rewardCoin, rewardExp, userId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 残高確認
    const userResult = await client.query(
      `SELECT coin FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );
    const user = userResult.rows[0];
    if (!user || user.coin < rewardCoin) {
      throw new Error("Insufficient balance");
    }

    // coin消費
    await client.query(
      `UPDATE users SET coin = coin - $1 WHERE id = $2`,
      [rewardCoin, userId]
    );

    // クエスト作成
    const result = await client.query(
      `INSERT INTO quests (title, description, reward_coin, reward_exp, created_by, is_approved)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [title, description, rewardCoin, 25, userId]  // EXP固定25
    );

    await client.query("COMMIT");
    return result.rows[0];

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getQuests = async (userId) => {
  const result = await pool.query(
    `SELECT 
       q.id, q.title, q.description, q.reward_coin, q.reward_exp,
       q.created_at, q.created_by,
       u.username AS created_by_username,
       CASE WHEN qp.id IS NOT NULL THEN true ELSE false END AS is_completed,
       qp.completer_approved,
       qp.creator_approved
     FROM quests q
     JOIN users u ON q.created_by = u.id
     LEFT JOIN quest_progress qp ON q.id = qp.quest_id AND qp.user_id = $1
     WHERE q.is_approved = true
     ORDER BY q.created_at DESC`,
    [userId]
  );
  return result.rows;
};

// 達成者が「達成する」を押す
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

    if (quest.created_by === userId) throw new Error("Cannot complete your own quest");

    const progressResult = await client.query(
      `SELECT * FROM quest_progress WHERE user_id = $1 AND quest_id = $2`,
      [userId, questId]
    );
    if (progressResult.rows.length > 0) throw new Error("Already completed");

    // 達成申請を登録（completer_approved=true、報酬はまだ付与しない）
    await client.query(
      `INSERT INTO quest_progress (user_id, quest_id, completer_approved, creator_approved)
       VALUES ($1, $2, true, false)`,
      [userId, questId]
    );

    await client.query("COMMIT");
    return { message: "awaiting creator approval" };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// 依頼者が「承認する」を押す → 報酬付与
export const approveCompletion = async (creatorId, questId, completerId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const questResult = await client.query(
      `SELECT * FROM quests WHERE id = $1 AND created_by = $2`,
      [questId, creatorId]
    );
    const quest = questResult.rows[0];
    if (!quest) throw new Error("Quest not found");

    const progressResult = await client.query(
      `SELECT * FROM quest_progress WHERE quest_id = $1 AND user_id = $2`,
      [questId, completerId]
    );
    const progress = progressResult.rows[0];
    if (!progress) throw new Error("Completion not found");
    if (progress.creator_approved) throw new Error("Already approved");

    // 依頼者承認
    await client.query(
      `UPDATE quest_progress SET creator_approved = true, completed_at = NOW()
       WHERE quest_id = $1 AND user_id = $2`,
      [questId, completerId]
    );

    // 報酬付与
    await client.query(
      `UPDATE users SET coin = coin + $1 WHERE id = $2`,
      [quest.reward_coin, completerId]
    );
    await addExp(client, completerId, 25);

    await client.query("COMMIT");
    return { message: "quest approved", reward: quest.reward_coin };

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
       q.id, q.title, q.description, q.reward_coin, q.reward_exp,
       qp.completed_at, qp.completer_approved, qp.creator_approved
     FROM quest_progress qp
     JOIN quests q ON qp.quest_id = q.id
     WHERE qp.user_id = $1
     ORDER BY qp.completed_at DESC NULLS LAST`,
    [userId]
  );
  return result.rows;
};

// 自分が作ったクエストの達成申請一覧
export const getPendingApprovals = async (creatorId) => {
  const result = await pool.query(
    `SELECT 
       qp.id AS progress_id,
       q.id AS quest_id,
       q.title,
       q.reward_coin,
       u.id AS completer_id,
       u.username AS completer_username,
       qp.completer_approved,
       qp.creator_approved
     FROM quest_progress qp
     JOIN quests q ON qp.quest_id = q.id
     JOIN users u ON qp.user_id = u.id
     WHERE q.created_by = $1 AND qp.completer_approved = true AND qp.creator_approved = false
     ORDER BY qp.id DESC`,
    [creatorId]
  );
  return result.rows;
};

export const getMyCreatedQuests = async (userId) => {
  const result = await pool.query(
    `SELECT id, title, description, reward_coin, reward_exp, is_approved, created_at
     FROM quests WHERE created_by = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};