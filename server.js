const express = require("express");
const { google } = require("googleapis");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const sender = users.find(u => u.email === req.user.emails[0].value);


const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// セッション設定
app.use(session({ secret: "frieza-secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Passportでユーザ情報管理
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Googleログイン設定
passport.use(new GoogleStrategy({
  clientID: "974874855305-qnafiqffsq2h38hqbk2qt82a1vp1bfu6.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

// Googleログイン開始
app.get("/auth/google", passport.authenticate("google", { scope: ["profile","email"] }));


// 新しいルート：現在のログインユーザ情報取得（メールなど）
app.get("/current_user", ensureAuth, (req, res) => {
  // req.user.emails[0].value でメール取得可能
  res.json({
    displayName: req.user.displayName,
    email: req.user.emails[0].value
  });
});

// Googleログイン成功後、ユーザ名を設定する画面に誘導
app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // ログイン成功 → ユーザ名入力画面へ
    res.redirect("/set-username.html");
  }
);

// ユーザ名を受け取り、スプレッドシートに登録・更新する API
app.post("/set_username", ensureAuth, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: "ユーザ名が未入力です" });
  }

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // 既存データ取得（A2:D列まで）
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:D100`
  });

  const rows = response.data.values || [];
  const users = rows.map((r, i) => ({
    row: i + 2,
    id: r[0],
    username: r[1],
    email: r[2],
    balance: Number(r[3] || 0)
  }));

  const userEmail = req.user.emails[0].value;

  // 既存ユーザかどうか確認
  let existing = users.find(u => u.email === userEmail);

  if (existing) {
    // すでに登録されている → 名前を更新
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!B${existing.row}:B${existing.row}`,
      valueInputOption: "RAW",
      requestBody: { values: [[username]] }
    });
  } else {
    // 新規ユーザ追加
    // 新しいIDを決定（既存のIDの最大 + 1）
    const newId = users.length > 0
      ? Math.max(...users.map(u => Number(u.id))) + 1
      : 1;
    const newRow = users.length + 2;
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:D`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [newId, username, userEmail, 1000]
        ]
      }
    });
  }

  res.json({ success: true });
});

// 修正：ユーザ一覧取得時に email も含めて返すように
app.get("/users", ensureAuth, async (req, res) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:D100`
  });

  const rows = response.data.values || [];
  const users = rows.map(r => ({
    id: Number(r[0]),
    username: r[1],
    email: r[2],
    balance: Number(r[3] || 0)
  }));

  res.json(users);
});

// 送金 API の修正：送信者をメールで特定し、D列残高を使う
app.post("/send", ensureAuth, async (req, res) => {
  const { receiver_id, amount } = req.body;
  const amt = Number(amount);

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:D100`
  });
  const rows = response.data.values || [];
  const users = rows.map((r, i) => ({
    row: i + 2,
    id: Number(r[0]),
    username: r[1],
    email: r[2],
    balance: Number(r[3] || 0)
  }));

  const userEmail = req.user.emails[0].value;
  const sender = users.find(u => u.email === userEmail);
  const receiver = users.find(u => u.id === Number(receiver_id));

  if (!sender || !receiver) {
    return res.status(400).json({ error: "ユーザが存在しません" });
  }
  if (sender.balance < amt) {
    return res.status(400).json({ error: "残高不足です" });
  }

  // 更新
  sender.balance -= amt;
  receiver.balance += amt;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!D${sender.row}:D${sender.row}`,
    valueInputOption: "RAW",
    requestBody: { values: [[sender.balance]] }
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!D${receiver.row}:D${receiver.row}`,
    valueInputOption: "RAW",
    requestBody: { values: [[receiver.balance]] }
  });

  res.json({ message: "送金完了ですわ！" });
});
// ログインユーザ情報取得
app.get("/current_user", ensureAuth, (req, res) => {
  res.json({ displayName: req.user.displayName, email: req.user.emails[0].value });
});
// ユーザ名設定
app.post("/set_username", ensureAuth, async (req, res) => {
  const { username } = req.body;
  if (!username) return res.json({ success: false, error: "ユーザ名が空です" });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  // 既存データ取得
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:D100`
  });

  const rows = response.data.values || [];
  let users = rows.map((r, i) => ({
    row: i + 2,
    id: r[0],
    username: r[1],
    email: r[2],
    balance: Number(r[3] || 0)
  }));

  const email = req.user.emails[0].value;

  // 既存ユーザチェック
  let user = users.find(u => u.email === email);
  if (user) {
    // 既存ユーザ → ユーザ名更新
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!B${user.row}:B${user.row}`,
      valueInputOption: "RAW",
      requestBody: { values: [[username]] }
    });
  } else {
    // 新規ユーザ → 末尾に追加
    const newId = users.length + 1;
    const newRow = users.length + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${newRow}:D${newRow}`,
      valueInputOption: "RAW",
      requestBody: [[newId, username, email, 0]]
    });
  }

  res.json({ success: true });
});
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
