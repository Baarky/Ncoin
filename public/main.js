const nickname = localStorage.getItem('nickname');
if (!nickname) window.location.href = 'login.html';

document.getElementById('userName').textContent = nickname;

function loadUsers() {
  return JSON.parse(localStorage.getItem('users') || '{}');
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// 所持金表示
function updateBalance() {
  const users = loadUsers();
  document.getElementById('balance').textContent = users[nickname].balance;
}

// 送金処理
document.getElementById('sendBtn').addEventListener('click', () => {
  const to = document.getElementById('sendTo').value.trim();
  const amount = Number(document.getElementById('sendAmount').value);
  if (!to || !amount) return alert('送金先と金額を入力してください');

  const users = loadUsers();
  if (!users[to]) return alert('送金先が存在しません');
  if (users[nickname].balance < amount) return alert('残高不足');

  // 送金
  users[nickname].balance -= amount;
  users[to].balance += amount;

  // 履歴
  const date = new Date().toLocaleString();
  users[nickname].history.push({ to, amount, date });
  users[to].history.push({ from: nickname, amount, date });

  saveUsers(users);
  updateBalance();
  loadRanking();
  loadHistory();
  alert('送金完了');
});

// ランキング表示
function loadRanking() {
  const users = loadUsers();
  const ranking = Object.entries(users)
    .sort((a, b) => b[1].balance - a[1].balance);
  
  const rankingEl = document.getElementById('ranking');
  rankingEl.innerHTML = '';
  ranking.forEach(([name, data], i) => {
    rankingEl.innerHTML += `<li>${i+1}. ${name}: ${data.balance} Ncoin</li>`;
  });
}

// 履歴表示
function loadHistory() {
  const users = loadUsers();
  const histEl = document.getElementById('history');
  histEl.innerHTML = '';
  users[nickname].history.slice().reverse().forEach(h => {
    if (h.to) histEl.innerHTML += `<li>送金: ${h.to} に ${h.amount} Ncoin (${h.date})</li>`;
    else if (h.from) histEl.innerHTML += `<li>受取: ${h.from} から ${h.amount} Ncoin (${h.date})</li>`;
  });
}

updateBalance();
loadRanking();
loadHistory();
