// server.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const QRCode = require("qrcode");
const rateLimit = require("express-rate-limit");
const { Sequelize, DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 4000;

// ===== ミドルウェア =====
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ===== レートリミット =====
const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "送金リクエストが多すぎます。1分後に再度お試しください。"
});

// ===== SQLite DB設定 =====
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
  logging: false
});

// ユーザを匿名IDのみで扱う
const User = sequelize.define("User", {
  anonId: { type: DataTypes.STRING, unique: true, allowNull: false }
});

const Wallet = sequelize.define("Wallet", {
  balance: { type: DataTypes.INTEGER, defaultValue: 1000 }
});

User.hasOne(Wallet, { onDelete: "CASCADE" });
Wallet.belongsTo(User);

// DB初期化
(async () => {
  await sequelize.sync();
})();

// ===== ログインAPI =====
// サーバーには個人情報を保存せず、匿名IDを生成して返す
app.post("/login", async (req, res) => {
  let { nickname } = req.body;
  if (!nickname || nickname.trim() === "") {
    return res.status(400).json({ error: "ニックネームを入力してください。" });
  }

  // ニックネームはサーバーで保持せず、ユーザ識別は anonId のみ
  const anonId = uuidv4();

  const user = await User.create({ anonId });
  await Wallet.create({ UserId: user.id });

  // クライアント側は nickname と anonId を localStorage に保持する
  res.json({ success: true, anonId });
});

// ===== QRコード生成API =====
app.post("/api/qrcode", async (req, res) => {
  const { anonId } = req.body;
  if (!anonId) {
    return res.status(400).json({ error: "匿名IDが指定されていません。" });
  }

  const baseUrl = process.env.RENDER_EXTERNAL_URL || `localhost:${PORT}`;
  const url = `https://${baseUrl}/sendpage?to=${encodeURIComponent(anonId)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(url);
    res.json({ qr: qrDataUrl });
  } catch (err) {
    console.error("QRコード生成エラー:", err);
    res.status(500).json({ error: "QRコード生成に失敗しました。" });
  }
});

// ===== 送金API（例） =====
app.post("/api/send", sendLimiter, async (req, res) => {
  const { fromId, toId, amount } = req.body;
  if (!fromId || !toId || !amount) {
    return res.status(400).json({ error: "必要なデータが不足しています。" });
  }

  const sender = await User.findOne({ where: { anonId: fromId }, include: Wallet });
  const receiver = await User.findOne({ where: { anonId: toId }, include: Wallet });

  if (!sender || !receiver) return res.status(404).json({ error: "ユーザーが見つかりません。" });
  if (sender.Wallet.balance < amount) return res.status(400).json({ error: "残高不足です。" });

  sender.Wallet.balance -= amount;
  receiver.Wallet.balance += amount;
  await sender.Wallet.save();
  await receiver.Wallet.save();

  res.json({ success: true });
});

// ===== ページルーティング =====
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== サーバー起動 =====
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
