import express from "express";
import { getBalance } from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.get("/balance", authMiddleware, getBalance);

export default router;