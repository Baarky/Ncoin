import {
  createQuest, getQuests, getMyQuests, completeQuest,
  approveCompletion, getPendingApprovals
} from "../services/quest.service.js";
import { updateReportStatus } from "../services/admin.service.js";

export const create = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, rewardCoin, rewardExp } = req.body;

    if (!title || rewardCoin < 0) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const quest = await createQuest(title, description, rewardCoin, 25, userId);
    res.json(quest);

  } catch (err) {
    console.error(err);
    if (err.message === "Insufficient balance") return res.status(400).json({ error: "残高が不足しています" });
    res.status(500).json({ error: "Server error" });
  }
};

export const list = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const quests = await getQuests(userId);
    res.json(quests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const complete = async (req, res) => {
  try {
    const userId = req.user.id;
    const { questId } = req.body;

    if (!questId) return res.status(400).json({ error: "questId is required" });

    const result = await completeQuest(userId, questId);
    res.json(result);

  } catch (err) {
    console.error(err);
    if (err.message === "Quest not found") return res.status(404).json({ error: err.message });
    if (err.message === "Already completed") return res.status(400).json({ error: err.message });
    if (err.message === "Cannot complete your own quest") return res.status(403).json({ error: err.message });
    res.status(500).json({ error: "Server error" });
  }
};

export const myQuests = async (req, res) => {
  try {
    const userId = req.user.id;
    const quests = await getMyQuests(userId);
    res.json(quests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// 依頼者が達成を承認
export const approveComplete = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { questId, completerId } = req.body;

    if (!questId || !completerId) return res.status(400).json({ error: "Invalid input" });

    const result = await approveCompletion(creatorId, questId, completerId);
    res.json(result);

  } catch (err) {
    console.error(err);
    if (err.message === "Quest not found") return res.status(404).json({ error: err.message });
    if (err.message === "Already approved") return res.status(400).json({ error: err.message });
    res.status(500).json({ error: "Server error" });
  }
};

// 自分のクエストへの達成申請一覧
export const pendingApprovals = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const data = await getPendingApprovals(creatorId);
    res.json(data);
  } catch (err) {
    console.error(err);
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