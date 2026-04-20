import express from "express";
import { getMyQR } from "../controllers/qr.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/me", authMiddleware, getMyQR);
export default router;