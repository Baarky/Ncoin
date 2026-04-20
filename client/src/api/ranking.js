const API_URL = "http://localhost:3000/api";

export const getRanking = async () => {
  try {
    const res = await fetch(`${API_URL}/ranking`);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("getRanking error:", err);
    return { error: err.message };
  }
};