import { useState } from "react";
import {  register } from "../api/auth";
export default function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    if (!username || !password) {
      alert("入力してください");
      return;
    }

    try {
      if (isRegister) {
        const data = await register(username, password);

        if (data.id) {
          alert("登録成功");
          setIsRegister(false);
          setUsername("");
          setPassword("");
        } else {
          alert(data.error || "登録失敗");
        }

      } else {
        const data = await login(username, password);

        if (data.token) {
          localStorage.setItem("token", data.token);
          onLogin();
        } else {
          alert(data.error || "ログイン失敗");
        }
      }

    } catch (err) {
      console.error(err);
      alert("通信エラー");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{isRegister ? "新規登録" : "ログイン"}</h1>

      <input
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleSubmit}>
        {isRegister ? "登録" : "ログイン"}
      </button>

      <p>
        {isRegister ? "すでにアカウントがある？" : "アカウントがない？"}
        <button onClick={() => setIsRegister(!isRegister)}>
          切り替え
        </button>
      </p>
    </div>
  );
}