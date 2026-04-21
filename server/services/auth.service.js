import { pool } from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/token.js";


// ユーザー登録
export const registerUser = async (username, password) => {
  const hashed = await hashPassword(password);

  const query = `
    INSERT INTO users (username, password)
    VALUES ($1, $2)
    RETURNING id, username
  `;

  const result = await pool.query(query, [username, hashed]);
  return result.rows[0];
};


// ログイン
export const loginUser = async (username, password) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (user.is_banned) {
    throw new Error("User is banned");
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) throw new Error("Invalid credentials");
  const token = generateToken(user);

return {
  token,
  user: {
    id: user.id,
    username: user.username,
    role: user.role,
    is_admin: user.is_admin  // ← 追加
  }
};
};