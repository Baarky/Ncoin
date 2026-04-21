import jwt from "jsonwebtoken";
import { AUTH_CONFIG } from "../config/auth.js";


// トークン生成
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      is_admin: user.is_admin  // ← 追加
    },
    AUTH_CONFIG.JWT_SECRET,
    {
      expiresIn: "1h"
    }
  );
};


// トークン検証
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, AUTH_CONFIG.JWT_SECRET);
  } catch (err) {
    return null;
  }
};