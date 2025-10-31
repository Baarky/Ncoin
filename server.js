const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const QRCode = require("qrcode");

const ACCESS_CODE = process.env.ACCESS_CODE;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// --- DB ヘルパー ---
function loadDB() {
  try { return JSON.parse(fs.readFileSync("users.json", "utf8")); }
  catch { return {}; }
}
function saveDB(db) {
  fs.writeFileSync("users.json", JSON.stringify(db, null, 2));
}

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
  const db = loadDB();
  if (!db[nickname]) db[nickname] = { balance: 1000, history: [] };
  saveDB(db);
  res.json({ success: true, nickname });
});

// --- 残高 ---
app.get("/balance/:nickname", (req, res) => {
  const db = loadDB();
  const user = db[req.params.nickname];
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });
  res.json({ balance: user.balance });
});

// --- クエスト報酬 ---
app.post("/quest", (req, res) => {
  const { nickname, amount } = req.body;
  const db = loadDB();
  if (!db[nickname]) return res.status(404).json({ error: "ユーザーが存在しません" });

  db[nickname].balance += amount;
  db[nickname].history.push({ type: "クエスト報酬", amount, date: new Date().toISOString() });
  saveDB(db);

  io.emit("update");
  res.json({ balance: db[nickname].balance });
});

// --- 送金 ---
app.post("/send", (req, res) => {
  const { from, to, amount } = req.body;
  const db = loadDB();
  if (!db[from] || !db[to]) return res.status(400).json({ error: "ユーザーが存在しません" });
  if (db[from].balance < amount) return res.status(400).json({ error: "残高不足" });

  const date = new Date().toISOString();
  db[from].balance -= amount;
  db[to].balance += amount;
  db[from].history.push({ type: "送金", to, amount, date });
  db[to].history.push({ type: "受取", from, amount, date });

  saveDB(db);
  io.emit("update");
  res.json({ success: true, balance: db[from].balance });
});

// --- QRコード生成 ---
app.get("/generate-qr/:nickname/:amount", async (req, res) => {
  const { nickname, amount } = req.params;
  if (!nickname || !amount) return res.status(400).json({ error: "不足情報" });

  const payload = JSON.stringify({ from: nickname, amount: Number(amount) });
  try {
    const qr = await QRCode.toDataURL(payload);
    res.json({ qr });
  } catch (err) {
    res.status(500).json({ error: "QR生成失敗" });
  }
});

// --- ランキング ---
app.get("/ranking", (req, res) => {
  const db = loadDB();
  const ranking = Object.entries(db)
    .sort((a, b) => b[1].balance - a[1].balance)
    .map(([name, data]) => ({ nickname: name, balance: data.balance }));
  res.json(ranking);
});

// --- 履歴 ---
app.get("/history/:nickname", (req, res) => {
  const db = loadDB();
  const user = db[req.params.nickname];
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });
  res.json(user.history);
});

// --- Socket.io 接続 ---
io.on("connection", socket => {
  console.log("A user connected");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
