import express from "express";
import { getBalance } from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getUserProfile } from "../services/user.service.js";

const router = express.Router();

router.get("/balance", authMiddleware, getBalance);

// プロフィール取得
router.get("/profile/:username", authMiddleware, async (req, res) => {
  try {
    const profile = await getUserProfile(req.params.username);
    res.json(profile);
  } catch (err) {
    if (err.message === "User not found") return res.status(404).json({ error: err.message });
    res.status(500).json({ error: "Server error" });
  }
});

export default router;