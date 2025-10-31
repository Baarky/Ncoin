const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
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

// --- パスコードページ ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));

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

app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public/dashboard.html")));

// --- 残高取得 ---
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

  io.emit("update", { nickname, db }); // 全クライアントに通知
  res.json({ balance: db[nickname].balance });
});

app.post("/send", (req, res) => {
  const { from, to, amount } = req.body;
  const db = JSON.parse(fs.readFileSync("users.json", "utf8"));

  if (!db[from] || !db[to]) return res.status(400).json({ error: "ユーザーが存在しません" });
  if (db[from].balance < amount) return res.status(400).json({ error: "残高不足" });

  db[from].balance -= amount;
  db[to].balance += amount;

  // 履歴を追加
  const date = new Date().toISOString();
  db[from].history.push({ type: "送金", to, amount, date });
  db[to].history.push({ type: "受取", from, amount, date });

  fs.writeFileSync("users.json", JSON.stringify(db, null, 2));
  res.json({ success: true, balance: db[from].balance });
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
io.on("connection", (socket) => {
  console.log("A user connected");
});
const QRCode = require("qrcode");

// QRコード生成
app.post("/generate-qr", async (req, res) => {
  const { from, to, amount } = req.body;
  if (!from || !to || !amount) return res.status(400).json({ error: "不足情報" });

  const payload = JSON.stringify({ from, to, amount });
  try {
    const qr = await QRCode.toDataURL(payload); // base64画像
    res.json({ qr });
  } catch (err) {
    res.status(500).json({ error: "QR生成失敗" });
  }
});

app.post("/pay-qr", (req, res) => {
  const { from, to, amount } = req.body;
  const db = JSON.parse(fs.readFileSync("users.json", "utf8"));

  if (!db[from]) return res.status(404).json({ error: "送金元が存在しません" });
  if (!db[to]) return res.status(404).json({ error: "送金先が存在しません" });
  if (db[from].balance < amount) return res.status(400).json({ error: "残高不足" });

  db[from].balance -= amount;
  db[to].balance += amount;

  const date = new Date().toISOString();
  db[from].history.push({ type: "送金", to, amount, date });
  db[to].history.push({ type: "受取", from, amount, date });

  fs.writeFileSync("users.json", JSON.stringify(db, null, 2));
  res.json({ success: true });
});


const PORT = process.env.PORT || 3000; // ←これで OK
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));