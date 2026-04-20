import express from "express";
import { create } from "../controllers/quest.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { list } from "../controllers/quest.controller.js";
import { complete } from "../controllers/quest.controller.js";
import { myQuests } from "../controllers/quest.controller.js";

const router = express.Router();


// クエスト作成
router.post("/", authMiddleware, create);
router.get("/", list);
router.post("/complete", authMiddleware, complete);
router.get("/my", authMiddleware, myQuests);
router.get("/", authMiddleware, list);


export default router;