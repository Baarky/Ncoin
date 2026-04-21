import { useState, useEffect } from "react";
import { getQuests, completeQuest, getMyQuests, createQuest, getMyCreatedQuests } from "../api/quest";
import HomePage from "./HomePage";
import { useNavigate } from "react-router-dom";
export default function QuestPage() {
  const navigate = useNavigate();
  const [quests, setQuests] = useState([]);
  const [myQuests, setMyQuests] = useState([]);
  const [myCreatedQuests, setMyCreatedQuests] = useState([]);
  const [tab, setTab] = useState("all"); // "all" | "mine" | "create" | "pending"
  const [error, setError] = useState(null);

  // 作成フォーム用
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardCoin, setRewardCoin] = useState("");
  const [rewardExp, setRewardExp] = useState("");
  const [createError, setCreateError] = useState(null);

  const token = localStorage.getItem("token");

  const fetchAll = async () => {
    const [q, mq, mc] = await Promise.all([
      getQuests(token),
      getMyQuests(token),
      getMyCreatedQuests(token)
    ]);
    if (!q.error) setQuests(q);
    if (!mq.error) setMyQuests(mq);
    if (!mc.error) setMyCreatedQuests(mc);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleComplete = async (questId) => {
    if (!window.confirm("このクエストを達成しましたか？")) return;
    const result = await completeQuest(token, questId);
    if (result.error) {
      alert(result.error);
    } else {
      alert(`クエスト達成！ ${result.reward} coin獲得`);
      fetchAll();
    }
  };

  const handleCreate = async () => {
    setCreateError(null);
    if (!title || rewardCoin === "" || rewardExp === "") {
      setCreateError("タイトル・報酬coinと報酬expは必須です");
      return;
    }
    const result = await createQuest(token, title, description, Number(rewardCoin), Number(rewardExp));
    if (result.error) {
      setCreateError(result.error);
    } else {
      alert("クエストを申請しました！管理者の承認をお待ちください");
      setTitle("");
      setDescription("");
      setRewardCoin("");
      setRewardExp("");
      fetchAll();
      setTab("pending");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>クエスト</h1>
        <button onClick={() => navigate("/")}>ホームに戻る</button>  {/* ← 追加 */}
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}

      {/* タブ */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        {[
          { key: "all", label: "クエスト一覧" },
          { key: "mine", label: "達成済み" },
          { key: "create", label: "クエスト申請" },
          { key: "pending", label: `申請状況 (${myCreatedQuests.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              fontWeight: tab === key ? "bold" : "normal",
              textDecoration: tab === key ? "underline" : "none"
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* クエスト一覧 */}
      {tab === "all" && (
        <div>
          {quests.length === 0 && <p>承認済みのクエストがありません</p>}
          {quests.map((quest) => (
            <div key={quest.id} style={{
              border: "1px solid #ccc", borderRadius: 8,
              padding: 16, marginBottom: 12,
              opacity: quest.is_completed ? 0.5 : 1
            }}>
              <h3 style={{ margin: "0 0 4px" }}>{quest.title}</h3>
              <p style={{ margin: "0 0 8px", color: "#555" }}>{quest.description}</p>
              <p style={{ margin: "0 0 8px" }}>報酬: {quest.reward_coin} coin / {quest.reward_exp} exp</p>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888" }}>作成者: {quest.created_by_username}</p>
              {quest.is_completed ? (
                <span style={{ color: "green" }}>✅ 達成済み</span>
              ) : (
                <button onClick={() => handleComplete(quest.id)}>達成する</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 達成済み */}
      {tab === "mine" && (
        <div>
          {myQuests.length === 0 && <p>まだ達成したクエストがありません</p>}
          {myQuests.map((quest) => (
            <div key={quest.id} style={{
              border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 12
            }}>
              <h3 style={{ margin: "0 0 4px" }}>{quest.title}</h3>
              <p style={{ margin: "0 0 4px" }}>{quest.description}</p>
              <p style={{ margin: "0 0 4px" }}>報酬: {quest.reward_coin} coin / {quest.reward_exp} exp</p>
              <p style={{ fontSize: 12, color: "#888" }}>
                達成日: {new Date(quest.completed_at).toLocaleDateString("ja-JP")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* クエスト申請フォーム */}
      {tab === "create" && (
        <div style={{ maxWidth: 480 }}>
          <p style={{ color: "#888", marginBottom: 16 }}>
            申請したクエストは管理者の承認後に一覧へ表示されます
          </p>
          {createError && <div style={{ color: "red", marginBottom: 8 }}>{createError}</div>}
          <div style={{ marginBottom: 12 }}>
            <label>タイトル *</label><br />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 掃除のお手伝い"
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>説明</label><br />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="クエストの詳細を書いてください"
              rows={3}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>報酬 coin *</label><br />
            <input
              type="number"
              value={rewardCoin}
              onChange={(e) => setRewardCoin(e.target.value)}
              placeholder="0"
              min={0}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>報酬 exp *</label><br />
            <input
              type="number"
              value={rewardExp}
              onChange={(e) => setRewardExp(e.target.value)}
              placeholder="0"
              min={0}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </div>
          <button onClick={handleCreate} style={{ padding: "8px 24px" }}>
            申請する
          </button>
        </div>
      )}

      {/* 申請状況 */}
      {tab === "pending" && (
        <div>
          {myCreatedQuests.length === 0 && <p>申請したクエストがありません</p>}
          {myCreatedQuests.map((quest) => (
            <div key={quest.id} style={{
              border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 12
            }}>
              <h3 style={{ margin: "0 0 4px" }}>{quest.title}</h3>
              <p style={{ margin: "0 0 4px", color: "#555" }}>{quest.description}</p>
              <p style={{ margin: "0 0 4px" }}>報酬: {quest.reward_coin} coin / {quest.reward_exp} exp</p>
              <p style={{ margin: 0 }}>
                状態:{" "}
                {quest.is_approved
                  ? <span style={{ color: "green" }}> 承認済み</span>
                  : <span style={{ color: "orange" }}> 承認待ち</span>
                }
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}