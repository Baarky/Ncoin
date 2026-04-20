import { createQuest } from "../services/quest.service.js";
import { getQuests } from "../services/quest.service.js";
import { getMyQuests } from "../services/quest.service.js";
import { completeQuest } from "../services/quest.service.js";
import { updateReportStatus } from "../services/admin.service.js";


// クエスト作成
export const create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, rewardCoin, rewardExp } = req.body;

    // 入力チェック
    if (!title || rewardCoin < 0 || rewardExp < 0) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const quest = await createQuest(
      title,
      description,
      rewardCoin,
      rewardExp,
      userId
    );

    res.json(quest);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
export const list = async (req, res) => {
  try {
    const userId = req.user?.userId || null;

    const quests = await getQuests(userId);

    res.json(quests);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


export const complete = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { questId } = req.body;

    if (!questId) {
      return res.status(400).json({ error: "questId is required" });
    }

    const result = await completeQuest(userId, questId);

    res.json(result);

  } catch (err) {
    console.error(err);

    if (err.message === "Quest not found") {
      return res.status(404).json({ error: err.message });
    }

    if (err.message === "Already completed") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Server error" });
  }
};


export const myQuests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const quests = await getMyQuests(userId);

    res.json(quests);

  } catch (err) {
    console.error(err);
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