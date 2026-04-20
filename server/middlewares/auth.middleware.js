import { verifyToken } from "../utils/token.js";


export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    if (user.is_banned) {
      return res.status(403).json({
        error: "User is banned"
      });
    }
    req.user = decoded;

    next();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
