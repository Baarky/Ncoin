const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// --- ユーザー管理 ---
function loadUsers() {
  if (!fs.existsSync('users.json')) fs.writeFileSync('users.json', '{}');
  return JSON.parse(fs.readFileSync('users.json'));
}
function saveUsers(users) {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

// --- ログイン ---
app.post('/login', (req, res) => {
  const { nickname } = req.body;
  let users = loadUsers();
  if (!users[nickname]) users[nickname] = { balance: 1000, history: [], quests: [] };
  req.session.user = nickname;
  saveUsers(users);
  res.json({ success: true });
});

// --- クエスト報酬リクエスト ---
app.post('/quest-reward', (req, res) => {
  const username = req.session.user;
  const { questId, reward } = req.body;

  if (!username) return res.status(401).json({ success: false, reason: 'ログインしてください' });

  let users = loadUsers();
  let user = users[username];

  // すでに報酬を受け取っていないかチェック
  if (user.quests.includes(questId)) {
    return res.json({ success: false, reason: 'すでに報酬取得済みです' });
  }

  // サーバー承認（簡易）
  const approved = true; // ここで条件をチェック可能
  if (approved) {
    user.balance += reward;
    user.history.push({ type: 'quest', questId, amount: reward, date: new Date().toISOString() });
    user.quests.push(questId);
    saveUsers(users);
    return res.json({ success: true, amount: reward });
  } else {
    return res.json({ success: false, reason: '承認されませんでした' });
  }
});

// --- ダッシュボード情報取得 ---
app.get('/dashboard', (req, res) => {
  const username = req.session.user;
  if (!username) return res.status(401).json({ success: false });

  let users = loadUsers();
  res.json({ user: users[username], ranking: Object.entries(users).sort((a,b)=>b[1].balance-a[1].balance) });
});

// --- ログアウト ---
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
