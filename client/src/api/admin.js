const API_URL = "/api";

const authHeader = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
});

export const getUsers = async (token) => {
  const res = await fetch(`${API_URL}/admin/users`, { headers: authHeader(token) });
  return res.json();
};

export const getReports = async (token) => {
  const res = await fetch(`${API_URL}/admin/reports`, { headers: authHeader(token) });
  return res.json();
};

export const getPendingQuests = async (token) => {
  const res = await fetch(`${API_URL}/admin/pending-quests`, { headers: authHeader(token) });
  return res.json();
};

export const banUser = async (token, userId) => {
  const res = await fetch(`${API_URL}/admin/ban`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify({ userId })
  });
  return res.json();
};

export const unbanUser = async (token, userId) => {
  const res = await fetch(`${API_URL}/admin/unban`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify({ userId })
  });
  return res.json();
};

export const distributeCoins = async (token, userId, amount) => {
  const res = await fetch(`${API_URL}/admin/distribute`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify({ userId, amount })
  });
  return res.json();
};

export const approveQuest = async (token, questId) => {
  const res = await fetch(`${API_URL}/admin/approve-quest`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify({ questId })
  });
  return res.json();
};

export const resolveReport = async (token, reportId) => {
  const res = await fetch(`${API_URL}/admin/reports`, {
    method: "PATCH",
    headers: authHeader(token),
    body: JSON.stringify({ reportId, status: "resolved" })
  });
  return res.json();
};
export const deleteQuest = async (token, questId) => {
  const res = await fetch(`${API_URL}/admin/delete-quest`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify({ questId })
  });
  return res.json();
};

export const createOfficialQuest = async (token, title, description, rewardCoin, rewardExp) => {
  const res = await fetch(`${API_URL}/admin/official-quest`, {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify({ title, description, rewardCoin, rewardExp })
  });
  return res.json();
};