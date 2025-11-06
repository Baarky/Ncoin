// server.js
const express = require("express");
const path = require("path");
const QRCode = require("qrcode");
const http = require("http");
const socketio = require("socket.io");
const { Sequelize, DataTypes } = require("sequelize");
const BetterSqlite3 = require("better-sqlite3"); // ← これを明示的に読み込む！

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// --- Sequelize 初期化 ---
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});



// --- モデル定義 ---
const User = sequelize.define("User", {
  nickname: { type: DataTypes.STRING, primaryKey: true },
  balance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1000 }
});

const History = sequelize.define("History", {
  type: DataTypes.STRING,
  sender: DataTypes.STRING,
  receiver: DataTypes.STRING,
  amount: DataTypes.INTEGER,
  date: DataTypes.STRING
});

(async () => {
  await sequelize.sync();
  console.log("✅ SQLite synced successfully");
})();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public/dashboard.html")));
app.get("/pay.html", (req, res) => res.sendFile(path.join(__dirname, "public/pay.html")));

app.post("/login", async (req, res) => {
  const nickname = req.body.nickname;
  let user = await User.findByPk(nickname);
  if (!user) {
    user = await User.create({ nickname, balance: 1000 });
  }
  res.json({ success: true, nickname });
});

app.get("/balance/:nickname", async (req, res) => {
  const user = await User.findByPk(req.params.nickname);
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });
  res.json({ balance: user.balance });
});

app.post("/quest", async (req, res) => {
  const { nickname, amount } = req.body;
  const user = await User.findByPk(nickname);
  if (!user) return res.status(404).json({ error: "ユーザーが存在しません" });

  user.balance += Number(amount);
  await user.save();
  await History.create({
    type: "クエスト報酬",
    receiver: nickname,
    amount,
    date: new Date().toISOString()
  });

  io.emit("update");
  res.json({ balance: user.balance });
});

app.post("/send", async (req, res) => {
  const { from, to, amount } = req.body;
  const sender = await User.findByPk(from);
  const receiver = await User.findByPk(to);

  if (!sender || !receiver) return res.status(400).json({ error: "ユーザーが存在しません" });
  if (sender.balance < amount) return res.status(400).json({ error: "残高不足" });

  sender.balance -= amount;
  receiver.balance += Number(amount);
  await sender.save();
  await receiver.save();

  const date = new Date().toISOString();
  await History.create({ type: "送金", sender: from, receiver: to, amount, date });
  await History.create({ type: "受取", sender: from, receiver: to, amount, date });

  io.emit("update");
  res.json({ success: true, balance: sender.balance });
});

app.get("/generate-qr/:nickname/:amount", async (req, res) => {
  const { nickname, amount } = req.params;
  const payload = JSON.stringify({ from: nickname, amount: Number(amount) });
  const qr = await QRCode.toDataURL(payload);
  res.json({ qr });
});

app.get("/ranking", async (req, res) => {
  const ranking = await User.findAll({
    order: [["balance", "DESC"]],
    attributes: ["nickname", "balance"]
  });
  res.json(ranking);
});

app.get("/history/:nickname", async (req, res) => {
  const nickname = req.params.nickname;
  const history = await History.findAll({
    where: {
      [Sequelize.Op.or]: [{ sender: nickname }, { receiver: nickname }]
    },
    order: [["date", "DESC"]]
  });
  res.json(history);
});

io.on("connection", () => console.log("✅ A user connected"));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
