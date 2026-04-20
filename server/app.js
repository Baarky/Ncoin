import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import reportRoutes from "./routes/report.routes.js";

import { logger } from "./middlewares/logger.middleware.js";
import { rateLimit } from "./middlewares/rateLimit.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import transactionRoutes from "./routes/transaction.routes.js";
import questRoutes from "./routes/quest.routes.js";
import rankingRoutes from "./routes/ranking.routes.js";
import qrRoutes from "./routes/qr.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/users.routes.js";

const app = express();


// ミドルウェア（順序重要）
app.use(logger);          // ログ
app.use(rateLimit);       // レート制限
app.use(cors());          // CORS許可
app.use(express.json());  // JSONパース
app.use("/api/transaction", transactionRoutes);


// ルーティング
app.use("/api/auth", authRoutes);
app.use("/api/quests", questRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);  // ← 追加

// ヘルスチェック
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


// エラーハンドリング（最後）
app.use(errorHandler);


export default app;