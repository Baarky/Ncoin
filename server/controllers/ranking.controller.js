import { getRanking } from "../services/ranking.service.js";


export const ranking = async (req, res) => {
  try {
    const data = await getRanking();
    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};