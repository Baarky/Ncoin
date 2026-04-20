import { getReports, banUser } from "../services/admin.service.js";

// 通報一覧
export const reports = async (req, res) => {
  try {
    const data = await getReports();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// BAN
export const ban = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId required" });
    }

    await banUser(userId);

    res.json({ message: "User banned" });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
export const updateReport = async (req, res) => {
  try {
    const { reportId, status } = req.body;

    if (!reportId || !status) {
      return res.status(400).json({ error: "Invalid input" });
    }

    if (!["pending", "resolved"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await updateReportStatus(reportId, status);

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};