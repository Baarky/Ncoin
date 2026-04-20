const API_URL = "http://localhost:3000/api";

export const sendCoin = async (token, toUsername, amount) => {
  const res = await fetch(`${API_URL}/transactions/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ toUsername, amount })
  });

  return res.json();
};