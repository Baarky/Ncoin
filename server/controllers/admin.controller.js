import {
  getReports, banUser, unbanUser, updateReportStatus,
  getAllUsers, giveCoins, approveQuest, getPendingQuests, deleteQuest, createOfficialQuest
} from "../services/admin.service.js";

export const reports = async (req, res) => {
  try {
    const data = await getReports();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const ban = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    await banUser(userId);
    res.json({ message: "User banned" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const unban = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    await unbanUser(userId);
    res.json({ message: "User unbanned" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const updateReport = async (req, res) => {
  try {
    const { reportId, status } = req.body;
    if (!reportId || !status) return res.status(400).json({ error: "Invalid input" });
    if (!["pending", "resolved"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    const result = await updateReportStatus(reportId, status);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const users = async (req, res) => {
  try {
    const data = await getAllUsers();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const distribute = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || amount === undefined) return res.status(400).json({ error: "Invalid input" });
    const result = await giveCoins(userId, amount);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const approve = async (req, res) => {
  try {
    const { questId } = req.body;
    if (!questId) return res.status(400).json({ error: "questId required" });
    const result = await approveQuest(questId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const pendingQuests = async (req, res) => {
  try {
    const data = await getPendingQuests();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
export const removeQuest = async (req, res) => {
  try {
    const { questId } = req.body;
    if (!questId) return res.status(400).json({ error: "questId required" });
    await deleteQuest(questId);
    res.json({ message: "Quest deleted" });
  } catch (err) {
    console.error(err);
    if (err.message === "Quest not found") return res.status(404).json({ error: err.message });
    res.status(500).json({ error: "Server error" });
  }
};

export const officialQuest = async (req, res) => {
  try {
    const { title, description, rewardCoin, rewardExp } = req.body;
    if (!title || rewardCoin < 0 || rewardExp < 0) {
      return res.status(400).json({ error: "Invalid input" });
    }
    const quest = await createOfficialQuest(title, description, rewardCoin, rewardExp);
    res.json(quest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};