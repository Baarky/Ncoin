const API_URL = "http://localhost:3000/api";

export const getBalance = async (token) => {
  const res = await fetch(`${API_URL}/users/balance`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.json();
};