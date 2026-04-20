// server/services/transaction.service.js

import { pool } from "../config/db.js";

export const sendCoin = async (fromUserId, toUsername, amount) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ① 送金先取得
    const userResult = await client.query(
      `SELECT id FROM users WHERE username = $1 FOR UPDATE`,
      [toUsername]
    );
    const toUser = userResult.rows[0];

    if (!toUser) {
      throw new Error("User not found");
    }

    const toUserId = toUser.id;

    // 自分送金防止（最終防衛）
    if (fromUserId === toUserId) {
      throw new Error("Cannot send to yourself");
    }

    // ② 送る側取得＆ロック
    const senderResult = await client.query(
      `SELECT coin FROM users WHERE id = $1 FOR UPDATE`,
      [fromUserId]
    );
    const sender = senderResult.rows[0];

    if (!sender || sender.coin < amount) {
      throw new Error("Insufficient balance");
    }

    // ③ 減算
    await client.query(
      `UPDATE users SET coin = coin - $1 WHERE id = $2`,
      [amount, fromUserId]
    );

    // ④ 加算
    await client.query(
      `UPDATE users SET coin = coin + $1 WHERE id = $2`,
      [amount, toUserId]
    );

    // ⑤ 履歴記録
    await client.query(
      `INSERT INTO transactions (from_user_id, to_user_id, amount)
       VALUES ($1, $2, $3)`,
      [fromUserId, toUserId, amount]
    );

    await client.query("COMMIT");

    return {
      message: "success",
      toUserId,
      amount
    };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;

  } finally {
    client.release();
  }
};