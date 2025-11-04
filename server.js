// server.js
const express = require("express");
const path = require("path");
require("dotenv").config();

const QRCode = require("qrcode");
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const { Sequelize, DataTypes, Op } = require("sequelize");
const sequelize = new Sequelize({
  dialect: "sqlite",
  dialectModule: require("better-sqlite3"),  // ← ここを追加
  storage: path.join(__dirname, "database.sqlite"),
  logging: false,
});


// --- モデル定義 ---
const User = sequelize.define("User", {
  nickname: { type: DataTypes.STRING, primaryKey: true },
  balance: { type: DataTypes.INTEGER, defaultValue: 1000 },
});

const History = sequelize.define("History", {
  type: DataTypes.STRING, // "送金" or "受取" or "クエスト報酬"
  from: DataTypes.STRING,
  to: DataTypes.STRING,
  amount: DataTypes.INTEGER,
  date: DataTypes.STRING,
});

// --- 初期化 ---
(async () => {
  await sequelize.sync();
  console.log("✅ SQLite database synced");
})();

const ACCESS_CODE = process.env.ACCESS_CODE || "1234";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// --- ルート ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public/dashboard.html")));
app.get("/pay.html", (req, res) => res.sendFile(path.join(__dirname, "public/pay.html")));

// --- パスコード認証 ---
app.post("/auth", (req, res) => {
  if (req.body.code === ACCESS_CODE) res.redirect("/login.html");
  else res.send("<h2>パスコードが違います。<a href='/'>戻る</a></h2>");
});

// --- ログイン ---
app.post("/login", async (req, res) => {
  const nickname = req.body.nickname;
  let user = await User.findByPk(nickname);
  if (!user) {
    user = await User.create({ nickname, balance: 1000 });
  }
  res.json({ success: true, nickname });
});

// --- 残高 ---
app.get("/balance/:nickname", async (req, res) => {
  const user = await User.findByPk(req.params.nickname);
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });
  res.json({ balance: user.balance });
});

// --- クエスト報酬 ---
app.post("/quest", async (req, res) => {
  const { nickname, amount } = req.body;
  const user = await User.findByPk(nickname);
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });

  user.balance += amount;
  await user.save();
  await History.create({ type: "クエスト報酬", to: nickname, amount, date: new Date().toISOString() });

  io.emit("update");
  res.json({ balance: user.balance });
});

// --- 送金 ---
app.post("/send", async (req, res) => {
  const { from, to, amount } = req.body;
  const sender = await User.findByPk(from);
  const receiver = await User.findByPk(to);

  if (!sender || !receiver) return res.status(400).json({ error: "ユーザーが存在しません" });
  if (sender.balance < amount) return res.status(400).json({ error: "残高不足" });

  sender.balance -= amount;
  receiver.balance += amount;

  await sender.save();
  await receiver.save();

  const date = new Date().toISOString();
  await History.bulkCreate([
    { type: "送金", from, to, amount, date },
    { type: "受取", from, to, amount, date },
  ]);

  io.emit("update");
  res.json({ success: true, balance: sender.balance });
});

// --- QRコード生成 ---
app.get("/generate-qr/:nickname/:amount", async (req, res) => {
  const { nickname, amount } = req.params;
  const payload = JSON.stringify({ from: nickname, amount: Number(amount) });
  const qr = await QRCode.toDataURL(payload);
  res.json({ qr });
});

// --- ランキング ---
app.get("/ranking", async (req, res) => {
  const users = await User.findAll({ order: [["balance", "DESC"]] });
  const ranking = users.map(u => ({ nickname: u.nickname, balance: u.balance }));
  res.json(ranking);
});

// --- 履歴 ---
app.get("/history/:nickname", async (req, res) => {
  const history = await History.findAll({
    where: { [Op.or]: [{ from: req.params.nickname }, { to: req.params.nickname }] },
    order: [["date", "DESC"]],
  });
  res.json(history);
});

// --- Socket.io ---
io.on("connection", () => console.log("✅ A user connected"));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
