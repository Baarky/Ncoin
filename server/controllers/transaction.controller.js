// server/controllers/transaction.controller.js

import { sendCoin } from "../services/transaction.service.js";
import { validateAmount } from "../utils/validator.js";
import { pool } from "../config/db.js";
import jwt from "jsonwebtoken";


// 残高取得
export const getBalance = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT coin FROM users WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];

    res.json({
      coin: user.coin
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


// 送金
export const send = async (req, res) => {
  try {
    const fromUserId = req.user.userId;
    const { toUsername, amount } = req.body;

    // 入力チェック（順番重要）
    if (!toUsername || !validateAmount(amount)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (req.user.username === toUsername) {
      return res.status(400).json({ error: "Cannot send to yourself" });
    }

    const result = await sendCoin(fromUserId, toUsername, amount);

    res.json(result);

  } catch (err) {
    console.error(err);

    if (err.message === "User not found") {
      return res.status(404).json({ error: err.message });
    }

    if (err.message === "Insufficient balance") {
      return res.status(400).json({ error: err.message });
    }

    if (err.message === "Cannot send to yourself") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Server error" });
  }
};


// 履歴取得
export const getHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT 
         u1.username AS from_username,
         u2.username AS to_username,
         t.amount,
         t.created_at
       FROM transactions t
       JOIN users u1 ON t.from_user_id = u1.id
       JOIN users u2 ON t.to_user_id = u2.id
       WHERE t.from_user_id = $1 OR t.to_user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
const SECRET = process.env.QR_SECRET || "secret";

export const sendByQR = async (req, res) => {
  try {
    const { token } = req.body;

    // 検証
    const decoded = jwt.verify(token, SECRET);

    const fromUserId = req.user.userId;

    const result = await sendCoin(
      fromUserId,
      decoded.to,
      decoded.amount
    );

    res.json(result);

  } catch (err) {
    return res.status(400).json({
      error: "Invalid or expired QR"
    });
  }
};