const express = require('express');
const fs = require('fs');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Railway対応ポート

app.use(express.json());
app.use(
  session({
    secret: process.env.SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: true
  })
);

// ニックネームでログイン
app.post('/login', (req, res) => {
  const { nickname } = req.body;
  let users = {};
  if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json'));
  }
  if (!users[nickname]) users[nickname] = { balance: 1000, history: [] };
  fs.writeFileSync('users.json', JSON.stringify(users));
  req.session.user = nickname;
  res.json({ success: true });
});

// 送金
app.post('/send', (req, res) => {
  const from = req.session.user;
  const { to, amount } = req.body;
  if (!fs.existsSync('users.json')) return res.status(400).json({ error: 'ユーザー情報なし' });
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

// ランキング取得
app.get('/ranking', (req, res) => {
  if (!fs.existsSync('users.json')) return res.json([]);
  const users = JSON.parse(fs.readFileSync('users.json'));
  const ranking = Object.entries(users)
    .sort((a, b) => b[1].balance - a[1].balance);
  res.json(ranking);
});

// 画面表示（ルート）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ダッシュボード画面
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    // ログインしていない場合はルートにリダイレクト
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

// ログイン処理
app.post('/login', (req, res) => {
  const { nickname } = req.body;
  let users = {};
  if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json'));
  }
  if (!users[nickname]) users[nickname] = { balance: 1000, history: [] };
  fs.writeFileSync('users.json', JSON.stringify(users));
  
  // セッションにユーザーを保存
  req.session.user = nickname;

  // ログイン後は /dashboard にリダイレクト
  res.json({ success: true, redirect: '/dashboard' });
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
