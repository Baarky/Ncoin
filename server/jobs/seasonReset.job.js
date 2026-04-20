import cron from "node-cron";
import { pool } from "../config/db.js";

export const startSeasonResetJob = () => {
  cron.schedule("0 0 1 * *", async () => {
    console.log("シーズンリセット開始");

    try {
      await pool.query(`UPDATE users SET exp = 0`);

      await pool.query(`DELETE FROM quest_progress`);

      console.log("シーズンリセット完了");
    } catch (err) {
      console.error(err);
    }
  });
};