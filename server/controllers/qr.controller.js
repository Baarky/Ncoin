import { generateQR } from "../services/qr.service.js";

export const getMyQR = async (req, res) => {
  try {
    const username = req.user.username;
    const { amount } = req.query; // ←追加

    const qr = await generateQR(username, Number(amount));

    res.json({ qr });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};