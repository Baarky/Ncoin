import { createReport } from "../services/report.service.js";

export const report = async (req, res) => {
  try {
    const reporterId = req.user.userId;
    const { targetUserId, reason } = req.body;

    if (!targetUserId || !reason) {
      return res.status(400).json({ error: "Invalid input" });
    }

    if (reporterId === targetUserId) {
      return res.status(400).json({ error: "Cannot report yourself" });
    }

    const result = await createReport(
      reporterId,
      targetUserId,
      reason
    );

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};