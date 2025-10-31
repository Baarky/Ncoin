const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_CODE = process.env.ACCESS_CODE || "12345";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// DB読み書き関数
function loadDB() {
  try {
    const data = fs.readFileSync("users.json", "utf8");
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
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

// --- ダッシュボード ---
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public/dashboard.html"));
});

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
  res.json({ balance: db[nickname].balance });
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
// --- 送金 ---
app.post("/send", (req, res) => {
  const { from, to, amount } = req.body;
  const db = loadDB();

  if (!db[from]) return res.status(404).json({ error: "送金元ユーザーが存在しません" });
  if (!db[to]) return res.status(404).json({ error: "送金先ユーザーが存在しません" });
  if (db[from].balance < amount) return res.status(400).json({ error: "残高不足" });

  db[from].balance -= amount;
  db[to].balance += amount;

  const date = new Date().toISOString();
  db[from].history.push({ type: "送金", to, amount, date });
  db[to].history.push({ type: "受取", from, amount, date });

  saveDB(db);
  res.json({ success: true, balance: db[from].balance });
});
// 送金ボタン
document.getElementById("sendBtn").addEventListener("click", async () => {
  const to = document.getElementById("sendTo").value.trim();
  const amount = Number(document.getElementById("sendAmount").value);
  if (!to || !amount) return alert("送金先と金額を入力してください");

  const res = await fetch("/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: nickname, to, amount })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  balanceEl.textContent = data.balance;
  fetchHistory();
  fetchRanking();
  alert(`${amount} コインを ${to} に送金しました`);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
