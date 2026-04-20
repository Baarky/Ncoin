const API_URL = "/api";

export const sendCoin = async (token, toUsername, amount) => {
  try {
    const res = await fetch(`${API_URL}/transaction/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ toUsername, amount })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("sendCoin error:", err);
    return { error: err.message };
  }
};