import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBalance } from "../api/user";
import { sendCoin } from "../api/transaction";
import { getRanking } from "../api/ranking";

export default function HomePage({ onLogout, user }) {
  const [coin, setCoin] = useState(0);
  const [toUsername, setToUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await getBalance(token);
      if (data.error) { setError(data.error); return; }
      if (data && data.coin !== undefined) { setCoin(data.coin); setError(null); }
    } catch (err) {
      setError("残高取得に失敗しました");
    }
  };

  useEffect(() => { fetchBalance(); }, []);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const data = await getRanking();
        setRanking(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRanking();
  }, []);

  const handleSend = async () => {
    const token = localStorage.getItem("token");
    const result = await sendCoin(token, toUsername, Number(amount));
    if (result.error) {
      alert(result.error);
    } else {
      alert("送金成功");
      await fetchBalance();
      setAmount("");
      setToUsername("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>ホーム</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/quest")}>クエスト</button>
          {user?.is_admin && (
            <button onClick={() => navigate("/admin")}>管理者ページ</button>
          )}
          <button onClick={() => navigate(`/profile/${user?.username}`)}>マイプロフィール</button>
          <button onClick={onLogout}>ログアウト</button>
        </div>
      </div>

      {error && <div style={{ color: "red", marginBottom: 20 }}>{error}</div>}

      <p>残高: {coin} coin</p>

      <h2>送金</h2>
      <input
        placeholder="送信先ユーザー名"
        value={toUsername}
        onChange={(e) => setToUsername(e.target.value)}
      />
      <input
        placeholder="金額"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleSend}>送金</button>

<h2>EXP所持ランキング</h2>
<ul>
  {ranking.map((u, index) => (
    <li key={u.id || index} style={{ cursor: "pointer" }}
      onClick={() => navigate(`/profile/${u.username}`)}>
      {u.username} - {u.exp} lv {u.level}
    </li>
  ))}
</ul>

<h2>コイン所持ランキング</h2>
<ul>
  {ranking.map((u, index) => (
    <li key={u.id || index} style={{ cursor: "pointer" }}
      onClick={() => navigate(`/profile/${u.username}`)}>
      {u.username} - {u.coin} coin
    </li>
  ))}
</ul>
    </div>
  );
}