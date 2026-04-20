import { pool } from "../config/db.js";


export const addExp = async (client, userId, exp) => {
  const result = await client.query(
    `UPDATE users 
     SET exp = exp + $1
     WHERE id = $2
     RETURNING exp, level`,
    [exp, userId]
  );

  const user = result.rows[0];

  const newLevel = Math.floor(user.exp / 100) + 1;

  if (newLevel > user.level) {
    await client.query(
      `UPDATE users SET level = $1 WHERE id = $2`,
      [newLevel, userId]
    );
  }

  return {
    exp: user.exp,
    level: newLevel
  };
};