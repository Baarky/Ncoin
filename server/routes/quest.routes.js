import express from "express";
import { create, list, complete, myQuests, approveComplete, pendingApprovals } from "../controllers/quest.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getMyCreatedQuests } from "../services/quest.service.js";

const router = express.Router();

router.get("/", list);
router.post("/", authMiddleware, create);
router.post("/complete", authMiddleware, complete);
router.get("/my", authMiddleware, myQuests);
router.post("/approve-completion", authMiddleware, approveComplete);
router.get("/pending-approvals", authMiddleware, pendingApprovals);
router.get("/my-created", authMiddleware, async (req, res) => {
  try {
    const quests = await getMyCreatedQuests(req.user.id);
    res.json(quests);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;