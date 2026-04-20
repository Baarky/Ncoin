import { registerUser, loginUser } from "../services/auth.service.js";
import { validateUsername, validatePassword } from "../utils/validator.js";
// ユーザー登録
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 入力チェック
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



export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const { token, user } = await loginUser(username, password);

    return res.json({
      token,
      user
    });

  } catch (err) {
    console.error(err);

    if (err.message === "Invalid credentials") {
      return res.status(401).json({
        error: err.message
      });
    }

    if (err.message === "User is banned") {
      return res.status(403).json({
        error: err.message
      });
    }

    return res.status(500).json({
      error: err.message
    });
  }
};