import { useState, useEffect } from "react";
import { getBalance } from "../api/user";
import { sendCoin } from "../api/transaction";
import { getRanking } from "../api/ranking"; // ← 追加

export default function HomePage() {
  const [coin, setCoin] = useState(0);
  const [toUsername, setToUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await getBalance(token);
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      if (data && data.coin !== undefined) {
        setCoin(data.coin);
        setError(null);
      }
    } catch (err) {
      setError("残高取得に失敗しました");
    }
  };

  // 初回ロード
  useEffect(() => {
    fetchBalance();
  }, []);

  // ランキング取得
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

  // 送金
  const handleSend = async () => {
    const token = localStorage.getItem("token");
    const result = await sendCoin(token, toUsername, Number(amount));

    if (result.error) {
      alert(result.error);
    } else {
      alert("送金成功");

      await fetchBalance(); // ← 更新

      setAmount("");
      setToUsername("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>ホーム</h1>
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

      <h2>ランキング</h2>
      <ul>
        {ranking.map((user) => (
          <li key={user.id}>
            {user.username} - {user.exp}
          </li>
        ))}
      </ul>
    </div>
  );
}