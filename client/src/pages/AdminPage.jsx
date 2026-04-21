import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, getReports, getPendingQuests, banUser, unbanUser, distributeCoins, approveQuest, resolveReport } from "../api/admin";

export default function AdminPage() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [pendingQuests, setPendingQuests] = useState([]);
  const [coinAmount, setCoinAmount] = useState({});
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const fetchAll = async () => {
    const [u, r, q] = await Promise.all([
      getUsers(token),
      getReports(token),
      getPendingQuests(token)
    ]);
    if (!u.error) setUsers(u);
    if (!r.error) setReports(r);
    if (!q.error) setPendingQuests(q);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleBan = async (userId, isBanned) => {
    if (!window.confirm(isBanned ? "BANを解除しますか？" : "このユーザーをBANしますか？")) return;
    if (isBanned) {
      await unbanUser(token, userId);
    } else {
      await banUser(token, userId);
    }
    fetchAll();
  };

  const handleDistribute = async (userId) => {
    const amount = Number(coinAmount[userId]);
    if (!amount || isNaN(amount)) return alert("金額を入力してください");
    if (!window.confirm(`${amount > 0 ? amount + " coin配布" : Math.abs(amount) + " coin没収"}しますか？`)) return;
    await distributeCoins(token, userId, amount);
    setCoinAmount((prev) => ({ ...prev, [userId]: "" }));
    fetchAll();
  };

  const handleApprove = async (questId) => {
    if (!window.confirm("このクエストを承認しますか？")) return;
    await approveQuest(token, questId);
    fetchAll();
  };

  const handleResolve = async (reportId) => {
    await resolveReport(token, reportId);
    fetchAll();
  };

  const tabs = [
    { key: "users", label: `ユーザー管理 (${users.length})` },
    { key: "quests", label: `クエスト承認 (${pendingQuests.length})` },
    { key: "reports", label: `通報 (${reports.filter(r => r.status === "pending").length})` },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>管理者ページ</h1>
        <button onClick={() => navigate("/")}>ホームに戻る</button>
      </div>

      {/* タブ */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{ fontWeight: tab === key ? "bold" : "normal", textDecoration: tab === key ? "underline" : "none" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ユーザー管理 */}
      {tab === "users" && (
        <div>
          {users.map((user) => (
            <div key={user.id} style={{
              border: "1px solid #ccc", borderRadius: 8, padding: 16,
              marginBottom: 12, opacity: user.is_banned ? 0.6 : 1
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{user.username}</strong>
                  {user.is_admin && <span style={{ marginLeft: 8, color: "blue", fontSize: 12 }}>管理者</span>}
                  {user.is_banned && <span style={{ marginLeft: 8, color: "red", fontSize: 12 }}>BAN中</span>}
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#555" }}>
                    {user.coin} coin / {user.exp} exp / Lv{user.level}
                  </p>
                </div>
                {!user.is_admin && (
                  <button
                    onClick={() => handleBan(user.id, user.is_banned)}
                    style={{ color: user.is_banned ? "green" : "red" }}
                  >
                    {user.is_banned ? "BAN解除" : "BAN"}
                  </button>
                )}
              </div>

              {/* コイン配布/没収 */}
              {!user.is_admin && (
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="number"
                    placeholder="例: 100 or -100"
                    value={coinAmount[user.id] || ""}
                    onChange={(e) => setCoinAmount((prev) => ({ ...prev, [user.id]: e.target.value }))}
                    style={{ padding: 4, width: 160 }}
                  />
                  <button onClick={() => handleDistribute(user.id)}>
                    coin配布/没収
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* クエスト承認 */}
      {tab === "quests" && (
        <div>
          {pendingQuests.length === 0 && <p>承認待ちのクエストはありません</p>}
          {pendingQuests.map((quest) => (
            <div key={quest.id} style={{
              border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 12
            }}>
              <h3 style={{ margin: "0 0 4px" }}>{quest.title}</h3>
              <p style={{ margin: "0 0 4px", color: "#555" }}>{quest.description}</p>
              <p style={{ margin: "0 0 4px" }}>報酬: {quest.reward_coin} coin / {quest.reward_exp} exp</p>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888" }}>申請者: {quest.created_by_username}</p>
              <button
                onClick={() => handleApprove(quest.id)}
                style={{ color: "green" }}
              >
                承認する
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 通報一覧 */}
      {tab === "reports" && (
        <div>
          {reports.length === 0 && <p>通報はありません</p>}
          {reports.map((report) => (
            <div key={report.id} style={{
              border: "1px solid #ccc", borderRadius: 8, padding: 16,
              marginBottom: 12, opacity: report.status === "resolved" ? 0.5 : 1
            }}>
              <p style={{ margin: "0 0 4px" }}>
                <strong>{report.reporter_username}</strong> が <strong>{report.target_username}</strong> を通報
              </p>
              <p style={{ margin: "0 0 4px", color: "#555" }}>理由: {report.reason}</p>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888" }}>
                {new Date(report.created_at).toLocaleDateString("ja-JP")}
              </p>
              {report.status === "pending" ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleBan(report.target_user_id, false)} style={{ color: "red" }}>
                    対象ユーザーをBAN
                  </button>
                  <button onClick={() => handleResolve(report.id)}>
                    解決済みにする
                  </button>
                </div>
              ) : (
                <span style={{ color: "green" }}>✅ 解決済み</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}