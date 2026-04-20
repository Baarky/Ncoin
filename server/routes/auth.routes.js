import express from "express";
import { register, login } from "../controllers/auth.controller.js";
import passport from "passport";

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