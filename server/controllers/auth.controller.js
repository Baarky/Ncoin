import { registerUser, loginUser } from "../services/auth.service.js";
import { validateUsername, validatePassword } from "../utils/validator.js";
import { ENV } from "../config/env.js";

// ユーザー登録
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!validateUsername(username) || !validatePassword(password)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const user = await registerUser(username, password);
    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// 一般ログイン
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const { token, user } = await loginUser(username, password);
    return res.json({ token, user });

  } catch (err) {
    console.error(err);
    if (err.message === "Invalid credentials") return res.status(401).json({ error: err.message });
    if (err.message === "User is banned") return res.status(403).json({ error: err.message });
    return res.status(500).json({ error: err.message });
  }
};

// 管理者ログイン
export const adminLogin = async (req, res) => {
  try {
    const { username, password, adminSecret } = req.body;

    // 管理者コードチェック
    if (adminSecret !== ENV.ADMIN_SECRET) {
      return res.status(401).json({ error: "Invalid admin secret" });
    }

    const { token, user } = await loginUser(username, password);

    // 管理者かチェック
    if (!user.is_admin) {
      return res.status(403).json({ error: "Not an admin" });
    }

    return res.json({ token, user });

  } catch (err) {
    console.error(err);
    if (err.message === "Invalid credentials") return res.status(401).json({ error: err.message });
    return res.status(500).json({ error: err.message });
  }
};