const API_URL = "/api";

export const getQuests = async (token) => {
  try {
    const res = await fetch(`${API_URL}/quests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("getQuests error:", err);
    return { error: err.message };
  }
};

export const createQuest = async (token, title, description, rewardCoin) => {
  try {
    const res = await fetch(`${API_URL}/quests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, description, rewardCoin, rewardExp: 25 })
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("createQuest error:", err);
    return { error: err.message };
  }
};

export const completeQuest = async (token, questId) => {
  try {
    const res = await fetch(`${API_URL}/quests/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ questId })
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("completeQuest error:", err);
    return { error: err.message };
  }
};

export const getMyQuests = async (token) => {
  try {
    const res = await fetch(`${API_URL}/quests/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("getMyQuests error:", err);
    return { error: err.message };
  }
};

export const getMyCreatedQuests = async (token) => {
  try {
    const res = await fetch(`${API_URL}/quests/my-created`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("getMyCreatedQuests error:", err);
    return { error: err.message };
  }
};

export const getPendingApprovals = async (token) => {
  try {
    const res = await fetch(`${API_URL}/quests/pending-approvals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("getPendingApprovals error:", err);
    return { error: err.message };
  }
};

export const approveCompletion = async (token, questId, completerId) => {
  try {
    const res = await fetch(`${API_URL}/quests/approve-completion`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ questId, completerId })
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("approveCompletion error:", err);
    return { error: err.message };
  }
};