const requestMap = new Map();

const LIMIT = 100; // 1分あたりのリクエスト数
const WINDOW_MS = 60 * 1000;


export const rateLimit = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();

  if (!requestMap.has(ip)) {
    requestMap.set(ip, []);
  }

  const timestamps = requestMap.get(ip);

  // 古いリクエスト削除
  const recent = timestamps.filter(t => now - t < WINDOW_MS);
  recent.push(now);

  requestMap.set(ip, recent);

  if (recent.length > LIMIT) {
    return res.status(429).json({ error: "Too many requests" });
  }

  next();
};