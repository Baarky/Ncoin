const express = require("express");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public")); // フロントを置くフォルダ

// Google Sheets API セットアップ
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // サービスアカウント鍵
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const spreadsheetId = "YOUR_SPREADSHEET_ID"; // シートのIDを入力
const sheetName = "Sheet1";

// ユーザ一覧取得
app.get("/users", async (req, res) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:C`,
  });

  const rows = response.data.values || [];
  const users = rows.map((r) => ({
    id: r[0],
    username: r[1],
    balance: parseInt(r[2]),
  }));

  res.json(users);
});

// 送金処理
app.post("/send", async (req, res) => {
  const { sender_id, receiver_id, amount } = req.body;
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:C`,
  });

  const rows = response.data.values || [];
  let users = rows.map((r, i) => ({
    row: i + 2,
    id: r[0],
    username: r[1],
    balance: parseInt(r[2]),
  }));

  const sender = users.find((u) => u.id === String(sender_id));
  const receiver = users.find((u) => u.id === String(receiver_id));

  if (!sender || !receiver) {
    return res.status(400).json({ error: "ユーザが存在しません" });
  }
  if (sender.balance < amount) {
    return res.status(400).json({ error: "残高不足です" });
  }

  // 残高更新
  sender.balance -= amount;
  receiver.balance += amount;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!C${sender.row}:C${sender.row}`,
    valueInputOption: "RAW",
    requestBody: { values: [[sender.balance]] },
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!C${receiver.row}:C${receiver.row}`,
    valueInputOption: "RAW",
    requestBody: { values: [[receiver.balance]] },
  });

  res.json({ message: "送金完了ですわ！" });
});

// サーバ起動
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
