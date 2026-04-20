import express from "express";
import { reports, ban } from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { updateReport } from "../controllers/admin.controller.js";

const router = express.Router();

// 管理者専用
router.get("/reports", authMiddleware, adminMiddleware, reports);
router.post("/ban", authMiddleware, adminMiddleware, ban);
router.patch(
  "/reports",
  authMiddleware,
  adminMiddleware,
  updateReport
);
export default router;