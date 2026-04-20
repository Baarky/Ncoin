const API_URL = "http://localhost:3000/api";

export const getBalance = async (token) => {
  try {
    // /users/balance → 別のエンドポイントに変更
    // サーバーにあるルートに合わせる
    const res = await fetch(`${API_URL}/auth/balance`, {  // または別のエンドポイント
      headers: {
        Authorization: `Bearer ${token}`
      }
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