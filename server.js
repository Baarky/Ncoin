const express = require('express');
const fs = require('fs');
const session = require('express-session');
const path = require('path');
const app = express();

// ポートは Railway の環境変数 PORT を使う
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// public を静的配信
app.use(express.static(path.join(__dirname, 'public')));

// ルートでログインページ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ニックネームでログイン
app.post('/login', (req, res) => {
  const { nickname } = req.body;
  let users = JSON.parse(fs.readFileSync('users.json'));
  if (!users[nickname]) users[nickname] = { balance: 1000, history: [] };
  fs.writeFileSync('users.json', JSON.stringify(users));
  req.session.user = nickname;
  res.json({ success: true });
});

// 送金
app.post('/send', (req, res) => {
  const from = req.session.user;
  const { to, amount } = req.body;
  let users = JSON.parse(fs.readFileSync('users.json'));

  if (!users[to]) return res.status(400).json({ error: '送金先が存在しません' });
  if (users[from].balance < amount) return res.status(400).json({ error: '残高不足' });

  users[from].balance -= amount;
  users[to].balance += amount;

  const date = new Date().toISOString();
  users[from].history.push({ to, amount, date });
  users[to].history.push({ from, amount, date });

  fs.writeFileSync('users.json', JSON.stringify(users));
  res.json({ success: true });
});

// ランキング
app.get('/ranking', (req, res) => {
  const users = JSON.parse(fs.readFileSync('users.json'));
  const ranking = Object.entries(users)
    .sort((a, b) => b[1].balance - a[1].balance);
  res.json(ranking);
});

app.listen(process.env.PORT || 3000, () => console.log("Server running"));
