require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const QRCode = require("qrcode");
const { sequelize, User, Wallet } = require("./models");
const path = require('path');

console.log('★ DB FILE PATH:', path.resolve('database.sqlite')); // デバッグ用

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findByPk(id, { include: Wallet });
  done(null, user);
});

const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    const user = await User.findOne({ where: { email } });
    if (!user) return done(null, false, { message: "ユーザーが存在しません" });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return done(null, false, { message: "パスワードが違います" });
    return done(null, user);
  }
));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
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
      } catch (err) {
        console.error("GoogleStrategy error:", err);
        done(err);
      }
    }
  )
);

// 管理者判定
function isAdmin(user) {
  return user && user.email && process.env.ADMIN_EMAIL &&
    user.email.trim().toLowerCase() === process.env.ADMIN_EMAIL.trim().toLowerCase();
}

// 管理者ポイント付与
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

// QRコード生成
app.get("/api/qrcode", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "ログインしてください" });
  const url = `https://${process.env.RENDER_EXTERNAL_URL}/sendpage?toEmail=${encodeURIComponent(req.user.email)}`;
  const qrDataUrl = await QRCode.toDataURL(url);
  res.json({ qr: qrDataUrl });
});

// 送金
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

// ログイン情報取得
app.get("/api/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "ログインしてください" });
  res.json({
    name: req.user.name,
    username: req.user.username,
    email: req.user.email,
    balance: req.user.Wallet.balance,
    isAdmin: isAdmin(req.user)
  });
});

// ページ
app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));
app.get("/dashboard", (req, res) => {
  if (!req.user) return res.redirect("/");
  res.sendFile(__dirname + "/public/dashboard.html");
});
app.get("/admin", (req, res) => {
  if (!req.user || !isAdmin(req.user)) return res.status(403).send("管理者専用ページです");
  res.sendFile(__dirname + "/public/admin.html");
});

// Google認証
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    if (!req.user.name) { // nameが未設定ならユーザ名設定ページへ
      return res.redirect("/set-username");
    }
    res.redirect("/dashboard");
  }
);
// ログアウト
app.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect("/");
  });
});

// ローカルログイン
app.post('/auth/local', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/'
}));

// ユーザ名設定ページ
app.get("/set-username", (req, res) => {
  if (!req.user) return res.redirect("/");
  res.sendFile(__dirname + "/public/login.html");
});
app.post('/set-username', async (req, res) => {
  if (!req.user) return res.redirect("/");
  const username = req.body.username;
  try {
    req.user.name = username;
    await req.user.save();
    console.log("save後 name:", req.user.name);
  } catch(err) {
    console.error("saveエラー:", err);
  }
  res.redirect("/dashboard");
});

// サーバ起動
(async () => {
  await sequelize.sync();
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`✅ Server running on port ${port}`));
})();