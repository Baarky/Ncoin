import app from "./app.js";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createUserTable } from "./models/user.model.js";
import { createTransactionTable } from "./models/transaction.model.js";
import { createQuestTable } from "./models/quest.model.js";
import { createSessionTable } from "./models/session.model.js";
import { createReportTable } from "./models/report.model.js";
import { createQuestProgressTable } from "./models/questProgress.model.js";
import { startRankingJob } from "./jobs/rankingUpdate.job.js";
import { startSeasonResetJob } from "./jobs/seasonReset.job.js";

const startServer = async () => {
  try {
    await connectDB();

    // テーブル作成
    await createUserTable();
    await createTransactionTable();
    await createQuestTable();
    await createSessionTable();
    await createReportTable();
    await createQuestProgressTable();
    app.listen(ENV.PORT, () => {
      console.log(`Server running on port ${ENV.PORT}`);
    });

  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
};

// 起動
startRankingJob();
startSeasonResetJob();
startServer();