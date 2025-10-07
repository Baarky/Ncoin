require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const QRCode = require("qrcode");
const SQLiteStore = require("connect-sqlite3")(session);
const { sequelize, User, Wallet } = require("./models");

const app = express();

// --- ミドルウェア ---
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite" }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // 本番では true
      maxAge: 7 * 24 * 60 * 60 * 1000
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(csrf({ cookie: true }));

// --- CSRFトークン発行 ---
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

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
  const url = `https://YOUR-NGROK-URL.ngrok-free.app/sendpage?toEmail=${encodeURIComponent(req.user.email)}`;
  const qrDataUrl = await QRCode.toDataURL(url);
  res.json({ qr: qrDataUrl });
});

// --- 送金 ---
app.post("/send", async (req, res) => {
  const { toEmail, amount } = req.body;
  const numAmount = Number(amount);

  if (!req.user) return res.status(401).json({ error: "ログインしてください" });
  if (!Number.isFinite(numAmount) || numAmount <= 0) return res.status(400).json({ error: "送金額は1以上で指定してください。" });

  const fromUser = await User.findByPk(req.user.id, { include: Wallet });
  const toUser = await User.findOne({ where: { email: toEmail }, include: Wallet });
  if (!toUser) return res.status(404).json({ error: "送金先が見つかりません。" });

  if (fromUser.Wallet.balance < numAmount) return res.status(400).json({ error: "残高が不足しています。" });

  // 送金処理
  fromUser.Wallet.balance -= numAmount;
  toUser.Wallet.balance += numAmount;
  await fromUser.Wallet.save();
  await toUser.Wallet.save();

  res.json({
    from: fromUser.Wallet.balance,
    to: toUser.Wallet.balance,
    message: `送金完了：${toEmail} に ${numAmount} ポイント送金しました。`
  });
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

// --- ダッシュボード & 管理者ページ ---
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

require('dotenv').config();

const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: true
}));

const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // ユーザー処理
  }
));

// --- サーバ起動 ---
(async () => {
  await sequelize.sync();
  app.listen(process.env.PORT || 4000, () => console.log(`✅ Server running on port ${process.env.PORT || 4000}`));
})();
