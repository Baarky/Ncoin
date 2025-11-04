// server.js
const express = require("express");
const path = require("path");
const QRCode = require("qrcode");
const http = require("http");
const socketio = require("socket.io");
const Database = require("better-sqlite3");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// --- DB 初期化 ---
const db = new Database(path.join(__dirname, "data.sqlite"));

// ユーザーテーブル
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    nickname TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 1000
  )
`).run();

// 履歴テーブル
db.prepare(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    sender TEXT,
    receiver TEXT,
    amount INTEGER,
    date TEXT
  )
`).run();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// --- ルート ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public/dashboard.html")));
app.get("/pay.html", (req, res) => res.sendFile(path.join(__dirname, "public/pay.html")));

// --- ログイン処理 ---
app.post("/login", (req, res) => {
  const nickname = req.body.nickname;
  const user = db.prepare("SELECT * FROM users WHERE nickname = ?").get(nickname);
  if (!user) {
    db.prepare("INSERT INTO users (nickname, balance) VALUES (?, ?)").run(nickname, 1000);
  }
  res.json({ success: true, nickname });
});

// --- 残高取得 ---
app.get("/balance/:nickname", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE nickname = ?").get(req.params.nickname);
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });
  res.json({ balance: user.balance });
});

// --- クエスト報酬 ---
app.post("/quest", (req, res) => {
  const { nickname, amount } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE nickname = ?").get(nickname);
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });

  const newBalance = user.balance + Number(amount);
  db.prepare("UPDATE users SET balance = ? WHERE nickname = ?").run(newBalance, nickname);
  db.prepare("INSERT INTO history (type, receiver, amount, date) VALUES (?, ?, ?, ?)").run(
    "クエスト報酬",
    nickname,
    amount,
    new Date().toISOString()
  );

  io.emit("update");
  res.json({ balance: newBalance });
});

// --- 送金 ---
app.post("/send", (req, res) => {
  const { from, to, amount } = req.body;
  const sender = db.prepare("SELECT * FROM users WHERE nickname = ?").get(from);
  const receiver = db.prepare("SELECT * FROM users WHERE nickname = ?").get(to);

  if (!sender || !receiver) return res.status(400).json({ error: "ユーザーが存在しません" });
  if (sender.balance < amount) return res.status(400).json({ error: "残高不足" });

  const senderNew = sender.balance - amount;
  const receiverNew = receiver.balance + Number(amount);

  db.prepare("UPDATE users SET balance = ? WHERE nickname = ?").run(senderNew, from);
  db.prepare("UPDATE users SET balance = ? WHERE nickname = ?").run(receiverNew, to);

  const date = new Date().toISOString();
  db.prepare("INSERT INTO history (type, sender, receiver, amount, date) VALUES (?, ?, ?, ?, ?)").run(
    "送金",
    from,
    to,
    amount,
    date
  );
  db.prepare("INSERT INTO history (type, sender, receiver, amount, date) VALUES (?, ?, ?, ?, ?)").run(
    "受取",
    from,
    to,
    amount,
    date
  );

  io.emit("update");
  res.json({ success: true, balance: senderNew });
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
  const ranking = db.prepare("SELECT nickname, balance FROM users ORDER BY balance DESC").all();
  res.json(ranking);
});

// --- 履歴 ---
app.get("/history/:nickname", (req, res) => {
  const history = db.prepare(`
    SELECT * FROM history
    WHERE sender = ? OR receiver = ?
    ORDER BY date DESC
  `).all(req.params.nickname, req.params.nickname);
  res.json(history);
});

// --- Socket.io ---
io.on("connection", () => console.log("✅ A user connected"));

// --- サーバー起動 ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
