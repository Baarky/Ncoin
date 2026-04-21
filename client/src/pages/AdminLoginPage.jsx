import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api/auth";

export default function AdminLoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(null);

    if (!username || !password || !adminSecret) {
      setError("すべての項目を入力してください");
      return;
    }

    const data = await adminLogin(username, password, adminSecret);

    if (data.error) {
      setError(data.error);
      return;
    }

    localStorage.setItem("token", data.token);
    onLogin(data.user);
    navigate("/admin");
  };

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto" }}>
      <h1>管理者ログイン</h1>

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

      <div style={{ marginBottom: 12 }}>
        <label>ユーザー名</label><br />
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          style={{ width: "100%", padding: 8, marginTop: 4 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>パスワード</label><br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          style={{ width: "100%", padding: 8, marginTop: 4 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>管理者コード</label><br />
        <input
          type="password"
          value={adminSecret}
          onChange={(e) => setAdminSecret(e.target.value)}
          placeholder="管理者専用コード"
          style={{ width: "100%", padding: 8, marginTop: 4 }}
        />
      </div>

      <button onClick={handleSubmit} style={{ padding: "8px 24px" }}>
        ログイン
      </button>
    </div>
  );
}