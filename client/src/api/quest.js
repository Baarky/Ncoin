const API_URL = "/api";

export const getQuests = async (token) => {
  try {
    const res = await fetch(`${API_URL}/quests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("getQuests error:", err);
    return { error: err.message };
  }
};

export const completeQuest = async (token, questId) => {
  try {
    const res = await fetch(`${API_URL}/quests/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ questId })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error: ${res.status}`);
    }
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
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("getMyQuests error:", err);
    return { error: err.message };
  }
};