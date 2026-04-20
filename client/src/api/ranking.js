const API_URL = "http://localhost:3000/api";

export const getRanking = async () => {
  const res = await fetch(`${API_URL}/ranking`);
  return res.json();
};