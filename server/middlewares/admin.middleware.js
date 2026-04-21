import { pool } from "../config/db.js";

export const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.id;  // ← userId → id

    const result = await pool.query(
      `SELECT is_admin FROM users WHERE id = $1`,
      [userId]
    );
    const user = result.rows[0];

    if (!user || !user.is_admin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};