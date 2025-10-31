const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_CODE = process.env.ACCESS_CODE;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

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
  const db = JSON.parse(fs.readFileSync("users.json", "utf8"));
  if (!db[nickname]) db[nickname] = { balance: 1000, history: [] };
  fs.writeFileSync("users.json", JSON.stringify(db, null, 2));
  res.json({ success: true, nickname });
});

// --- 残高取得 ---
app.get("/balance/:nickname", (req, res) => {
  const db = JSON.parse(fs.readFileSync("users.json", "utf8"));
  const user = db[req.params.nickname];
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });
  res.json({ balance: user.balance });
});

// --- クエスト報酬 ---
app.post("/quest", (req, res) => {
  const { nickname, amount } = req.body;
  const db = JSON.parse(fs.readFileSync("users.json", "utf8"));
  if (!db[nickname]) return res.status(404).json({ error: "ユーザーが存在しません" });
  db[nickname].balance += amount;
  db[nickname].history.push({ type: "クエスト報酬", amount, date: new Date().toISOString() });
  fs.writeFileSync("users.json", JSON.stringify(db, null, 2));
  res.json({ balance: db[nickname].balance });
});

// --- ランキング ---
app.get("/ranking", (req, res) => {
  const db = JSON.parse(fs.readFileSync("users.json", "utf8"));
  const ranking = Object.entries(db)
    .sort((a, b) => b[1].balance - a[1].balance)
    .map(([name, data]) => ({ nickname: name, balance: data.balance }));
  res.json(ranking);
});

// --- 履歴 ---
app.get("/history/:nickname", (req, res) => {
  const db = JSON.parse(fs.readFileSync("users.json", "utf8"));
  const user = db[req.params.nickname];
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });
  res.json(user.history);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
