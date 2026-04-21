import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUsers, getReports, getPendingQuests, banUser, unbanUser,
  distributeCoins, approveQuest, resolveReport,
  deleteQuest, createOfficialQuest  // ← 追加
} from "../api/admin";

export default function AdminPage() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [pendingQuests, setPendingQuests] = useState([]);
  const [coinAmount, setCoinAmount] = useState({});
  const navigate = useNavigate();

  // 公式クエスト作成フォーム用
  const [oTitle, setOTitle] = useState("");
  const [oDesc, setODesc] = useState("");
  const [oCoin, setOCoin] = useState("");
  const [oExp, setOExp] = useState("");
  const [oError, setOError] = useState(null);

  const token = localStorage.getItem("token");

  const fetchAll = async () => {
    const [u, r, q] = await Promise.all([
      getUsers(token), getReports(token), getPendingQuests(token)
    ]);
    if (!u.error) setUsers(u);
    if (!r.error) setReports(r);
    if (!q.error) setPendingQuests(q);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleBan = async (userId, isBanned) => {
    if (!window.confirm(isBanned ? "BANを解除しますか？" : "このユーザーをBANしますか？")) return;
    isBanned ? await unbanUser(token, userId) : await banUser(token, userId);
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

  const handleDelete = async (questId, title) => {
    if (!window.confirm(`「${title}」を削除しますか？\n作成者にcoinが返還されます`)) return;
    await deleteQuest(token, questId);
    fetchAll();
  };

  const handleCreateOfficial = async () => {
    setOError(null);
    if (!oTitle || oCoin === "" || oExp === "") {
      setOError("タイトル・coin・expは必須です");
      return;
    }
    const result = await createOfficialQuest(token, oTitle, oDesc, Number(oCoin), Number(oExp));
    if (result.error) {
      setOError(result.error);
    } else {
      alert("公式クエストを作成しました");
      setOTitle(""); setODesc(""); setOCoin(""); setOExp("");
      fetchAll();
    }
  };

  const handleResolve = async (reportId) => {
    await resolveReport(token, reportId);
    fetchAll();
  };

  const tabs = [
    { key: "users", label: `ユーザー管理 (${users.length})` },
    { key: "quests", label: `クエスト承認 (${pendingQuests.length})` },
    { key: "official", label: "公式クエスト作成" },
    { key: "reports", label: `通報 (${reports.filter(r => r.status === "pending").length})` },
  ];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>管理者ページ</h1>
        <button onClick={() => navigate("/")}>ホームに戻る</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ fontWeight: tab === key ? "bold" : "normal", textDecoration: tab === key ? "underline" : "none" }}>
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
                  <button onClick={() => handleBan(user.id, user.is_banned)}
                    style={{ color: user.is_banned ? "green" : "red" }}>
                    {user.is_banned ? "BAN解除" : "BAN"}
                  </button>
                )}
              </div>
              {!user.is_admin && (
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="number" placeholder="例: 100 or -100"
                    value={coinAmount[user.id] || ""}
                    onChange={(e) => setCoinAmount((prev) => ({ ...prev, [user.id]: e.target.value }))}
                    style={{ padding: 4, width: 160 }} />
                  <button onClick={() => handleDistribute(user.id)}>coin配布/没収</button>
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
              <p style={{ margin: "0 0 4px" }}>報酬: {quest.reward_coin} coin / 25 exp</p>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888" }}>申請者: {quest.created_by_username}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleApprove(quest.id)} style={{ color: "green" }}>承認する</button>
                <button onClick={() => handleDelete(quest.id, quest.title)} style={{ color: "red" }}>削除する</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 公式クエスト作成 */}
      {tab === "official" && (
        <div style={{ maxWidth: 480 }}>
          <p style={{ color: "#555", marginBottom: 16 }}>
            公式クエストはcoin消費なし・即時公開・exp自由設定です
          </p>
          {oError && <div style={{ color: "red", marginBottom: 8 }}>{oError}</div>}
          <div style={{ marginBottom: 12 }}>
            <label>タイトル *</label><br />
            <input value={oTitle} onChange={(e) => setOTitle(e.target.value)}
              placeholder="例: パスポート教材を完了させる"
              style={{ width: "100%", padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>説明</label><br />
            <textarea value={oDesc} onChange={(e) => setODesc(e.target.value)}
              rows={3} style={{ width: "100%", padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>報酬 coin *</label><br />
            <input type="number" value={oCoin} onChange={(e) => setOCoin(e.target.value)}
              placeholder="0" min={0} style={{ width: "100%", padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>報酬 exp *</label><br />
            <input type="number" value={oExp} onChange={(e) => setOExp(e.target.value)}
              placeholder="25" min={0} style={{ width: "100%", padding: 8, marginTop: 4 }} />
          </div>
          <button onClick={handleCreateOfficial} style={{ padding: "8px 24px" }}>
            公式クエストを作成
          </button>
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
                  <button onClick={() => handleResolve(report.id)}>解決済みにする</button>
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