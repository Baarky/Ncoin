// server.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const QRCode = require("qrcode");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 4000;

// ===== ミドルウェア =====
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ===== レートリミット =====
const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "送金リクエストが多すぎます。1分後に再度お試しください。"
});

// ===== ログインAPI =====
app.post("/login", (req, res) => {
  const { nickname } = req.body;
  if (!nickname || nickname.trim() === "") {
    return res.status(400).json({ error: "ニックネームを入力してください。" });
  }

  // サーバー側には保存せず、フロント側がlocalStorageで保持
  res.json({ success: true, nickname });
});

// ===== QRコード生成API =====
app.post("/api/qrcode", async (req, res) => {
  const { nickname } = req.body;
  if (!nickname || nickname.trim() === "") {
    return res.status(400).json({ error: "ニックネームが指定されていません。" });
  }

  const baseUrl = process.env.RENDER_EXTERNAL_URL || `localhost:${PORT}`;
  const url = `https://${baseUrl}/sendpage?to=${encodeURIComponent(nickname)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(url);
    res.json({ qr: qrDataUrl });
  } catch (err) {
    console.error("QRコード生成エラー:", err);
    res.status(500).json({ error: "QRコード生成に失敗しました。" });
  }
});

// ===== ページルーティング =====
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== サーバー起動 =====
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
