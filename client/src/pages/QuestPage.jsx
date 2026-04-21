import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getQuests, completeQuest, getMyQuests, createQuest,
  getMyCreatedQuests, getPendingApprovals, approveCompletion
} from "../api/quest";

export default function QuestPage() {
  const [quests, setQuests] = useState([]);
  const [myQuests, setMyQuests] = useState([]);
  const [myCreatedQuests, setMyCreatedQuests] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [tab, setTab] = useState("all");
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardCoin, setRewardCoin] = useState("");
  const [createError, setCreateError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchAll = async () => {
    const [q, mq, mc, pa] = await Promise.all([
      getQuests(token),
      getMyQuests(token),
      getMyCreatedQuests(token),
      getPendingApprovals(token)
    ]);
    if (!q.error) setQuests(q);
    if (!mq.error) setMyQuests(mq);
    if (!mc.error) setMyCreatedQuests(mc);
    if (!pa.error) setPendingApprovals(pa);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleComplete = async (questId) => {
    if (!window.confirm("このクエストの達成を申請しますか？")) return;
    const result = await completeQuest(token, questId);
    if (result.error) {
      alert(result.error);
    } else {
      alert("達成申請しました！依頼者の承認をお待ちください");
      fetchAll();
    }
  };

  const handleApproveCompletion = async (questId, completerId, username) => {
    if (!window.confirm(`${username} の達成を承認しますか？\ncoinが報酬として支払われます`)) return;
    const result = await approveCompletion(token, questId, completerId);
    if (result.error) {
      alert(result.error);
    } else {
      alert(`承認しました！${result.reward} coinを支払いました`);
      fetchAll();
    }
  };

  const handleCreate = async () => {
    setCreateError(null);
    if (!title || rewardCoin === "") {
      setCreateError("タイトルと報酬coinは必須です");
      return;
    }
    const result = await createQuest(token, title, description, Number(rewardCoin));
    if (result.error) {
      setCreateError(result.error);
    } else {
      alert("クエストを申請しました！管理者の承認をお待ちください");
      setTitle(""); setDescription(""); setRewardCoin("");
      fetchAll();
      setTab("pending");
    }
  };

  const tabs = [
    { key: "all", label: "クエスト一覧" },
    { key: "mine", label: "達成済み" },
    { key: "approvals", label: `ユーザー承認待ち (${pendingApprovals.length})` },
    { key: "create", label: "クエスト作成" },
    { key: "pending", label: `作成申請状況 (${myCreatedQuests.length})` },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>クエスト</h1>
        <button onClick={() => navigate("/")}>ホームに戻る</button>
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ fontWeight: tab === key ? "bold" : "normal", textDecoration: tab === key ? "underline" : "none" }}>
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
              border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 12,
              opacity: quest.is_completed ? 0.5 : 1
            }}>
              <h3 style={{ margin: "0 0 4px" }}>{quest.title}</h3>
              <p style={{ margin: "0 0 8px", color: "#555" }}>{quest.description}</p>
              <p style={{ margin: "0 0 8px" }}>報酬: {quest.reward_coin} coin / 25 exp</p>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888" }}>作成者: {quest.created_by_username}</p>
              {quest.is_completed ? (
                quest.creator_approved
                  ? <span style={{ color: "green" }}>✅ 完了</span>
                  : <span style={{ color: "orange" }}>⏳ 依頼者の承認待ち</span>
              ) : (
                <button onClick={() => handleComplete(quest.id)}>達成申請する</button>
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
              <p style={{ margin: "0 0 4px" }}>報酬: {quest.reward_coin} coin / 25 exp</p>
              <p style={{ margin: 0 }}>
                状態:{" "}
                {quest.creator_approved
                  ? <span style={{ color: "green" }}>✅ 報酬受取済み</span>
                  : <span style={{ color: "orange" }}>⏳ 依頼者の承認待ち</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 承認待ち（自分が依頼者のクエストへの達成申請） */}
      {tab === "approvals" && (
        <div>
          {pendingApprovals.length === 0 && <p>承認待ちの達成申請はありません</p>}
          {pendingApprovals.map((item) => (
            <div key={item.progress_id} style={{
              border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 12
            }}>
              <h3 style={{ margin: "0 0 4px" }}>{item.title}</h3>
              <p style={{ margin: "0 0 4px" }}>
                <strong>{item.completer_username}</strong> が達成申請しています
              </p>
              <p style={{ margin: "0 0 8px" }}>報酬: {item.reward_coin} coin</p>
              <button
                onClick={() => handleApproveCompletion(item.quest_id, item.completer_id, item.completer_username)}
                style={{ color: "green" }}
              >
                承認して報酬を支払う
              </button>
            </div>
          ))}
        </div>
      )}

      {/* クエスト申請フォーム */}
      {tab === "create" && (
        <div style={{ maxWidth: 480 }}>
          <p style={{ color: "#888", marginBottom: 16 }}>
            申請したクエストは管理者の承認後に一覧へ表示されます。<br />
            報酬coinはクエスト作成時に消費されます。
          </p>
          {createError && <div style={{ color: "red", marginBottom: 8 }}>{createError}</div>}
          <div style={{ marginBottom: 12 }}>
            <label>タイトル *</label><br />
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 掃除のお手伝い" style={{ width: "100%", padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>説明</label><br />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="クエストの詳細" rows={3} style={{ width: "100%", padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>報酬 coin * （この分のcoinが消費されます）</label><br />
            <input type="number" value={rewardCoin} onChange={(e) => setRewardCoin(e.target.value)}
              placeholder="0" min={0} style={{ width: "100%", padding: 8, marginTop: 4 }} />
          </div>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#555" }}>報酬 exp: 25（固定）</p>
          <button onClick={handleCreate} style={{ padding: "8px 24px" }}>申請する</button>
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
              <p style={{ margin: "0 0 4px" }}>報酬: {quest.reward_coin} coin / 25 exp</p>
              <p style={{ margin: 0 }}>
                状態:{" "}
                {quest.is_approved
                  ? <span style={{ color: "green" }}>✅ 承認済み</span>
                  : <span style={{ color: "orange" }}>⏳ 管理者承認待ち</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}