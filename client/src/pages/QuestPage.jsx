import { useState, useEffect } from "react";
import { getQuests, completeQuest, getMyQuests } from "../api/quest";

export default function QuestPage() {
  const [quests, setQuests] = useState([]);
  const [myQuests, setMyQuests] = useState([]);
  const [tab, setTab] = useState("all");
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  const fetchQuests = async () => {
    const data = await getQuests(token);
    if (data.error) {
      setError(data.error);
    } else {
      setQuests(data);
    }
  };

  const fetchMyQuests = async () => {
    const data = await getMyQuests(token);
    if (!data.error) setMyQuests(data);
  };

  useEffect(() => {
    fetchQuests();
    fetchMyQuests();
  }, []);

  const handleComplete = async (questId) => {
    if (!window.confirm("このクエストを達成しましたか？")) return;

    const result = await completeQuest(token, questId);

    if (result.error) {
      alert(result.error);
    } else {
      alert(`クエスト達成！ ${result.reward} coin獲得`);
      fetchQuests();
      fetchMyQuests();
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>クエスト</h1>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setTab("all")}
          style={{ fontWeight: tab === "all" ? "bold" : "normal", marginRight: 8 }}
        >
          クエスト一覧
        </button>
        <button
          onClick={() => setTab("mine")}
          style={{ fontWeight: tab === "mine" ? "bold" : "normal" }}
        >
          達成済み
        </button>
      </div>

      {tab === "all" && (
        <div>
          {quests.length === 0 && <p>クエストがありません</p>}
          {quests.map((quest) => (
            <div key={quest.id} style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              opacity: quest.is_completed ? 0.5 : 1
            }}>
              <h3 style={{ margin: "0 0 4px" }}>{quest.title}</h3>
              <p style={{ margin: "0 0 8px", color: "#555" }}>{quest.description}</p>
              <p style={{ margin: "0 0 8px" }}>
                報酬: {quest.reward_coin} coin / {quest.reward_exp} exp
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888" }}>
                作成者: {quest.created_by_username}
              </p>
              {quest.is_completed ? (
                <span style={{ color: "green" }}>✅ 達成済み</span>
              ) : (
                <button onClick={() => handleComplete(quest.id)}>
                  達成する
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "mine" && (
        <div>
          {myQuests.length === 0 && <p>まだ達成したクエストがありません</p>}
          {myQuests.map((quest) => (
            <div key={quest.id} style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12
            }}>
              <h3 style={{ margin: "0 0 4px" }}>{quest.title}</h3>
              <p style={{ margin: "0 0 4px" }}>{quest.description}</p>
              <p style={{ margin: "0 0 4px" }}>
                報酬: {quest.reward_coin} coin / {quest.reward_exp} exp
              </p>
              <p style={{ fontSize: 12, color: "#888" }}>
                達成日: {new Date(quest.completed_at).toLocaleDateString("ja-JP")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}