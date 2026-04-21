import express from "express";
import { create, list, complete, myQuests } from "../controllers/quest.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getMyCreatedQuests } from "../services/quest.service.js";

const router = express.Router();

router.get("/", list);
router.post("/", authMiddleware, create);
router.post("/complete", authMiddleware, complete);
router.get("/my", authMiddleware, myQuests);

// 自分が申請したクエスト一覧
router.get("/my-created", authMiddleware, async (req, res) => {
  try {
    const quests = await getMyCreatedQuests(req.user.id);
    res.json(quests);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;