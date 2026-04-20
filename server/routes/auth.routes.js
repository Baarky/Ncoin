import express from "express";
import { register, login } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import passport from "passport";
import { generateToken } from "../utils/token.js";

const router = express.Router();


// 登録
router.post("/register", register);

// ログイン
router.post("/login", login);
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
    // JWT発行（既存のtoken処理使う）
    const token = generateToken(req.user);

    res.json({ token });
  }
);

export default router;