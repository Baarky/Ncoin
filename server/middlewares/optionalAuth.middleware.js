import { verifyToken } from "../utils/token.js";


export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      req.user = null;
      return next();
    }

    req.user = decoded;

    next();

  } catch (err) {
    console.error(err);
    req.user = null;
    next();
  }
};