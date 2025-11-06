const express = require("express");
const fs = require("fs");

const path = require("path");
require("dotenv").config();

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const QRCode = require("qrcode");

const ACCESS_CODE = process.env.ACCESS_CODE;
const cors = require("cors");
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// === DB読み込み ===
function loadDB() {
  const file = "users.json";
  try {
    if (!fs.existsSync(file)) fs.writeFileSync(file, "{}");
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.error("❌ DB読み込みエラー:", err);
    return {};
  }
}


// ======== 🚧 安全な書き込みキュー機構 ========
let writeQueue = Promise.resolve();

// 書き込みを直列化してファイル競合を防止
async function safeSaveDB(db) {
  const data = JSON.stringify(db, null, 2);
  writeQueue = writeQueue.then(() =>
    fs.promises.writeFile("users.json", data).catch(err => {
      console.error("❌ users.json書き込み失敗:", err);
    })
  );
  return writeQueue;
}
// ======== 🚀 遅延フラッシュ機構 (高負荷対応) ========
let dbCache = null;
let saveTimer = null;

function loadDB() {
  try {
    if (dbCache) return dbCache;
    dbCache = JSON.parse(fs.readFileSync("users.json", "utf8"));
    return dbCache;
  } catch {
    dbCache = {};
    return dbCache;
  }
}

function safeSaveDB(db) {
  dbCache = db;
  if (saveTimer) return; // すでにタイマー動作中ならスキップ

  saveTimer = setTimeout(() => {
    fs.writeFile("users.json", JSON.stringify(dbCache, null, 2), (err) => {
      if (err) console.error("❌ 書き込みエラー:", err);
      saveTimer = null;
    });
  }, 500); // 0.5秒後にまとめて書き込み
}
// ==============================================

// ==============================================

// === ページルート ===
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public/dashboard.html")));
app.get("/pay.html", (req, res) => res.sendFile(path.join(__dirname, "public/pay.html")));

// === パスコード認証 ===
app.post("/auth", (req, res) => {
  if (req.body.code === ACCESS_CODE) res.redirect("/login.html");
  else res.send("<h2>パスコードが違います。<a href='/'>戻る</a></h2>");
});

// === ログイン ===
app.post("/login", (req, res) => {
  const nickname = req.body.nickname;
  const db = loadDB();
  if (!db[nickname]) db[nickname] = { balance: 1000, history: [] };
  safeSaveDB(db);
  res.json({ success: true, nickname });
});

// === 残高 ===
app.get("/balance/:nickname", (req, res) => {
  const db = loadDB();
  const user = db[req.params.nickname];
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });
  res.json({ balance: user.balance });
});

// === クエスト報酬 ===
app.post("/quest", async (req, res) => {
  const { nickname, amount } = req.body;
  const reward = Number(amount);

  if (!Number.isFinite(reward) || reward <= 0) {
    return res.status(400).json({ error: "金額が無効です" });
  }

  const db = loadDB();
  if (!db[nickname]) return res.status(404).json({ error: "ユーザーが存在しません" });

  db[nickname].balance += reward;
  db[nickname].history.push({ type: "クエスト報酬", amount: reward, date: new Date().toISOString() });
  await safeSaveDB(db);

  io.emit("update");
  res.json({ balance: db[nickname].balance });
});


// === 送金 ===
app.post("/send", async (req, res) => {
  const { from, to, amount } = req.body;
  const db = loadDB();
  if (!db[from] || !db[to]) return res.status(400).json({ error: "ユーザーが存在しません" });
  if (db[from].balance < amount) return res.status(400).json({ error: "残高不足" });

  const date = new Date().toISOString();
  db[from].balance -= amount;
  db[to].balance += amount;
  db[from].history.push({ type: "送金", to, amount, date });
  db[to].history.push({ type: "受取", from, amount, date });

  await safeSaveDB(db);
  io.emit("update");
  res.json({ success: true, balance: db[from].balance });
});

// === QRコード生成 ===
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

// === ランキング ===
app.get("/ranking", (req, res) => {
  const db = loadDB();
  const ranking = Object.entries(db)
    .sort((a, b) => b[1].balance - a[1].balance)
    .map(([name, data]) => ({ nickname: name, balance: data.balance }));
  res.json(ranking);
});

// === 履歴 ===
app.get("/history/:nickname", (req, res) => {
  const db = loadDB();
  const user = db[req.params.nickname];
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });
  res.json(user.history);
});

// === Socket.io 接続 ===
io.on("connection", (socket) => {
  console.log("✅ A user connected");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
