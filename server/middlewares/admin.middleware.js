import { pool } from "../config/db.js";


export const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT is_admin FROM users WHERE id = $1
    `;

    const result = await pool.query(query, [userId]);
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