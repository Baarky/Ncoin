import express from "express";
import { register, login, adminLogin } from "../controllers/auth.controller.js";  // ← adminLogin追加
import { authMiddleware } from "../middlewares/auth.middleware.js";
import passport from "passport";
import { generateToken } from "../utils/token.js";

const router = express.Router();

// 登録
router.post("/register", register);

// ログイン
router.post("/login", login);

// 管理者ログイン ← 追加
router.post("/admin-login", adminLogin);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

// トークン検証
router.get("/verify", authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false
  }),
  (req, res) => {
    const token = generateToken(req.user);
    res.json({ token });
  }
);

export default router;