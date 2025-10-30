const express = require('express');
const fs = require('fs');
const session = require('express-session');
const path = require('path');
const app = express();

app.use(express.json());
app.use(session({ secret: 'ncoin_secret', resave: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ログイン
app.post('/login', (req, res) => {
  const { nickname } = req.body;
  if (!nickname) return res.status(400).json({ error: 'ニックネームを入力してください' });

  let users = {};
  if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json'));
  }

  if (!users[nickname]) {
    users[nickname] = { balance: 1000, history: [] };
  }

  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  req.session.user = nickname;
  res.json({ success: true });
});

// 認証チェック
app.get('/session', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// 送金
app.post('/send', (req, res) => {
  const from = req.session.user;
  const { to, amount } = req.body;

  if (!from) return res.status(403).json({ error: 'ログインしてください' });
  if (!to || !amount) return res.status(400).json({ error: '送金先と金額を入力してください' });

  let users = JSON.parse(fs.readFileSync('users.json'));
  if (!users[to]) return res.status(400).json({ error: '送金先が存在しません' });
  if (users[from].balance < amount) return res.status(400).json({ error: '残高不足' });

  users[from].balance -= amount;
  users[to].balance += parseInt(amount);
  const date = new Date().toLocaleString();
  users[from].history.push({ to, amount, date });
  users[to].history.push({ from, amount, date });

  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  res.json({ success: true });
});

// 残高・ランキング取得
app.get('/data', (req, res) => {
  if (!req.session.user) return res.status(403).json({ error: 'ログインしてください' });
  const users = JSON.parse(fs.readFileSync('users.json'));
  const ranking = Object.entries(users)
    .sort((a, b) => b[1].balance - a[1].balance)
    .map(([name, data]) => ({ name, balance: data.balance }));

  res.json({
    user: req.session.user,
    balance: users[req.session.user].balance,
    ranking
  });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
