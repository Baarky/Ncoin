const API_URL = "/api";

export const login = async (username, password) => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "ログイン失敗");
    return data;
  } catch (err) {
    console.error(err);
    return { error: err.message };
  }
};

export const adminLogin = async (username, password, adminSecret) => {
  try {
    const res = await fetch(`${API_URL}/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, adminSecret })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "管理者ログイン失敗");
    return data;
  } catch (err) {
    console.error(err);
    return { error: err.message };
  }
};

export const register = async (username, password) => {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "登録失敗");
    return data;
  } catch (err) {
    console.error(err);
    return { error: err.message };
  }
};

export const verifyToken = async (token) => {
  try {
    const res = await fetch(`${API_URL}/auth/verify`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) throw new Error("トークンの有効期限が切れています");
      throw new Error(data.error || "トークンが無効です");
    }
    return { success: true, user: data.user };
  } catch (err) {
    console.error("Token verification error:", err);
    return { success: false, error: err.message };
  }
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
export const logout = () => {
  localStorage.removeItem("token");
};