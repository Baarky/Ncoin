const API_URL = "/api";

export const getBalance = async (token) => {
  try {
    const res = await fetch(`${API_URL}/transaction/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("getBalance error:", err);
    return { error: err.message };
  }
};

export const getUserProfile = async (token, username) => {
  try {
    const res = await fetch(`${API_URL}/users/profile/${username}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("getUserProfile error:", err);
    return { error: err.message };
  }
};