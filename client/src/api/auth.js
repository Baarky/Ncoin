const API_URL = "http://localhost:3000/api";

export const login = async (username, password) => {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "ログイン失敗");
    }

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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "登録失敗");
    }

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
      // ステータスコードで詳細判定
      if (res.status === 401) {
        throw new Error("トークンの有効期限が切れています");
      }
      throw new Error(data.error || "トークンが無効です");
    }

    return { success: true, user: data };

  } catch (err) {
    console.error("Token verification error:", err);
    return { success: false, error: err.message };
  }
};
export const logout = () => {
  localStorage.removeItem("token");
};