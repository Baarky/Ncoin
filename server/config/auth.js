import { ENV } from "./env.js";
import jwt from "jsonwebtoken";  // ← 上に移動

export const AUTH_CONFIG = {
  JWT_SECRET: ENV.JWT_SECRET,
  JWT_EXPIRES_IN: "7d"
};

export const generateToken = (payload) => {
  return jwt.sign(payload, AUTH_CONFIG.JWT_SECRET, {
    expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, AUTH_CONFIG.JWT_SECRET);
  } catch (err) {
    return null;
  }
};