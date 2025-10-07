require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const QRCode = require("qrcode");
const { sequelize, User, Wallet } = require("./models");

const app = express();

// --- ミドルウェア ---
app.use(express.json());

// --- セッション設定 ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: true,  sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// --- Passport 設定 ---
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findByPk(id, { include: Wallet });
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await User.findOne({ where: { googleId: profile.id } });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        });
        await Wallet.create({ UserId: user.id, balance: 1000 });
      }
      user = await User.findByPk(user.id, { include: Wallet });
      done(null, user);
    }
  )
);

// --- 管理者判定 ---
function isAdmin(user) {
  return user && user.email === process.env.ADMIN_EMAIL;
}

// --- 管理者ポイント付与 ---
app.post("/admin/addpoints", async (req, res) => {
  if (!req.user || !isAdmin(req.user)) return res.status(403).json({ error: "管理者権限が必要です" });

  const { toEmail, amount } = req.body;
  const amt = parseInt(amount);
  const user = await User.findOne({ where: { email: toEmail }, include: Wallet });
  if (!user) return res.status(404).json({ error: "ユーザーが見つかりません" });

  user.Wallet.balance += amt;
  await user.Wallet.save();

  res.json({ message: `${toEmail} に ${amt}ポイント付与しました`, balance: user.Wallet.balance });
});

// --- QRコード生成 ---
app.get("/api/qrcode", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "ログインしてください" });
  const url = `https://${process.env.RENDER_EXTERNAL_URL}/sendpage?toEmail=${encodeURIComponent(req.user.email)}`;
  const qrDataUrl = await QRCode.toDataURL(url);
  res.json({ qr: qrDataUrl });
});
const rateLimit = require('express-rate-limit');

const sendLimiter = rateLimit({
  windowMs: 60*1000, // 1分間
  max: 10,           // 最大10回
  message: "送金リクエストが多すぎます。1分後に再度お試しください。"
});

app.post("/send", async (req, res) => {
  const { toEmail, amount } = req.body;
  const numAmount = Number(amount);

  if (!req.user) return res.status(401).json({ error: "ログインしてください" });
  if (!Number.isFinite(numAmount) || numAmount <= 0) return res.status(400).json({ error: "送金額は1以上で指定してください。" });

  const fromUser = await User.findByPk(req.user.id, { include: Wallet });
  const toUser = await User.findOne({ where: { email: toEmail }, include: Wallet });
  if (!toUser) return res.status(404).json({ error: "送金先が見つかりません。" });
  if (fromUser.Wallet.balance < numAmount) return res.status(400).json({ error: "残高が不足しています。" });

  try {
    await sequelize.transaction(async (t) => {
      fromUser.Wallet.balance -= numAmount;
      toUser.Wallet.balance += numAmount;
      await fromUser.Wallet.save({ transaction: t });
      await toUser.Wallet.save({ transaction: t });
    });

    res.json({
      from: fromUser.Wallet.balance,
      to: toUser.Wallet.balance,
      message: `送金完了：${toEmail} に ${numAmount} ポイント送金しました。`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "送金中にエラーが発生しました。" });
  }
});


// --- ログイン情報取得 ---
app.get("/api/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "ログインしてください" });

  res.json({
    name: req.user.name,
    email: req.user.email,
    balance: req.user.Wallet.balance,
    isAdmin: isAdmin(req.user)
  });
});

// --- ページ ---
app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));
app.get("/dashboard", (req, res) => {
  if (!req.user) return res.redirect("/");
  res.sendFile(__dirname + "/public/dashboard.html");
});
app.get("/admin", (req, res) => {
  if (!req.user || !isAdmin(req.user)) return res.status(403).send("管理者専用ページです");
  res.sendFile(__dirname + "/public/admin.html");
});

// --- Google認証 ---
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => res.redirect("/dashboard")
);

// --- ログアウト ---
app.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect("/");
  });
});



// --- サーバ起動 ---
(async () => {
  await sequelize.sync();
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`✅ Server running on port ${port}`));
})();
