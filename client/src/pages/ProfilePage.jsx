import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserProfile } from "../api/user";

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetch = async () => {
      const data = await getUserProfile(token, username);
      if (data.error) {
        setError(data.error);
      } else {
        setProfile(data);
      }
    };
    fetch();
  }, [username]);

  if (error) return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate(-1)}>← 戻る</button>
      <p style={{ color: "red" }}>{error}</p>
    </div>
  );

  if (!profile) return <div style={{ padding: 20 }}>読み込み中...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 600 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>← 戻る</button>

      <h1>{profile.username}</h1>

      <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <p style={{ margin: "0 0 8px" }}>🪙 Ncoin: <strong>{profile.coin}</strong></p>
        <p style={{ margin: "0 0 8px" }}>⭐ EXP: <strong>{profile.exp}</strong></p>
        <p style={{ margin: "0 0 8px" }}>📊 レベル: <strong>{profile.level}</strong></p>
        <p style={{ margin: "0 0 8px" }}>📋 作成したクエスト数: <strong>{profile.created_quest_count}</strong></p>
        <p style={{ margin: 0 }}>✅ 達成したクエスト数: <strong>{profile.completed_quest_count}</strong></p>
      </div>

      <h2>作成したクエスト一覧</h2>
      {profile.created_quests.length === 0 && <p>まだクエストを作成していません</p>}
      {profile.created_quests.map((quest) => (
        <div key={quest.id} style={{
          border: "1px solid #ccc", borderRadius: 8, padding: 12, marginBottom: 8,
          opacity: quest.is_approved ? 1 : 0.6
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>
              {quest.is_official && (
                <span style={{
                  backgroundColor: "#FFD700", color: "#333",
                  fontSize: 11, padding: "2px 6px", borderRadius: 4,
                  marginRight: 6, fontWeight: "bold"
                }}>★ 公式</span>
              )}
              {quest.title}
            </h3>
            <span style={{ fontSize: 12, color: quest.is_approved ? "green" : "orange" }}>
              {quest.is_approved ? "承認済み" : "承認待ち"}
            </span>
          </div>
          {quest.description && (
            <p style={{ margin: "4px 0 0", color: "#555", fontSize: 13 }}>{quest.description}</p>
          )}
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
            報酬: {quest.reward_coin} coin / {quest.reward_exp_custom ?? 25} exp
          </p>
        </div>
      ))}
    </div>
  );
}