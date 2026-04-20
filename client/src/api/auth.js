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

export const logout = () => {
  localStorage.removeItem("token");
};