import express from "express";
import {
  reports, ban, unban, updateReport, users, distribute,
  approve, pendingQuests, removeQuest, officialQuest  // ← 追加
} from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = express.Router();
const auth = [authMiddleware, adminMiddleware];

router.get("/reports", ...auth, reports);
router.post("/ban", ...auth, ban);
router.post("/unban", ...auth, unban);
router.patch("/reports", ...auth, updateReport);
router.get("/users", ...auth, users);
router.post("/distribute", ...auth, distribute);
router.post("/approve-quest", ...auth, approve);
router.get("/pending-quests", ...auth, pendingQuests);
router.post("/delete-quest", ...auth, removeQuest);       // ← 追加
router.post("/official-quest", ...auth, officialQuest);   // ← 追加

export default router;