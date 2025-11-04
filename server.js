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

// --- データ管理（メモリベース） ---
const users = {};
const history = [];

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
app.post("/login", (req, res) => {
  const nickname = req.body.nickname;
  if (!users[nickname]) {
    users[nickname] = { balance: 1000 };
  }
  res.json({ success: true, nickname });
});

// --- 残高取得 ---
app.get("/balance/:nickname", (req, res) => {
  const user = users[req.params.nickname];
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });
  res.json({ balance: user.balance });
});

// --- クエスト報酬 ---
app.post("/quest", (req, res) => {
  const { nickname, amount } = req.body;
  const user = users[nickname];
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });

  user.balance += amount;
  history.push({ type: "クエスト報酬", to: nickname, amount, date: new Date().toISOString() });

  io.emit("update");
  res.json({ balance: user.balance });
});

// --- 送金 ---
app.post("/send", (req, res) => {
  const { from, to, amount } = req.body;
  const sender = users[from];
  const receiver = users[to];

  if (!sender || !receiver) return res.status(400).json({ error: "ユーザーが存在しません" });
  if (sender.balance < amount) return res.status(400).json({ error: "残高不足" });

  sender.balance -= amount;
  receiver.balance += amount;

  const date = new Date().toISOString();
  history.push(
    { type: "送金", from, to, amount, date },
    { type: "受取", from, to, amount, date }
  );

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
app.get("/ranking", (req, res) => {
  const ranking = Object.entries(users)
    .map(([nickname, u]) => ({ nickname, balance: u.balance }))
    .sort((a, b) => b.balance - a.balance);
  res.json(ranking);
});

// --- 履歴 ---
app.get("/history/:nickname", (req, res) => {
  const userHistory = history.filter(h => h.from === req.params.nickname || h.to === req.params.nickname);
  res.json(userHistory);
});

// --- Socket.io ---
io.on("connection", () => console.log("✅ A user connected"));

// --- サーバー起動 ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
