import express from "express";
import { send } from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getBalance } from "../controllers/transaction.controller.js";
import { getHistory } from "../controllers/transaction.controller.js";
import { sendByQR } from "../controllers/transaction.controller.js";

const router = express.Router();
router.get("/balance", authMiddleware, getBalance);
router.post("/send-qr", authMiddleware, sendByQR);
router.get("/history", authMiddleware, getHistory);

// 送金
router.post("/send", authMiddleware, send);


export default router