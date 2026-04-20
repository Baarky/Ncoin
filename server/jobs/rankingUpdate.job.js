import cron from "node-cron";
import { pool } from "../config/db.js";

export const startRankingJob = () => {
  cron.schedule("*/10 * * * *", async () => {
    console.log("ランキング更新開始");

    try {
      await pool.query(`
        UPDATE users
        SET rank = sub.rank
        FROM (
          SELECT id, RANK() OVER (ORDER BY exp DESC) as rank
          FROM users
        ) as sub
        WHERE users.id = sub.id
      `);

      console.log("ランキング更新完了");
    } catch (err) {
      console.error(err);
    }
  });
};