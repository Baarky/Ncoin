export const logger = (req, res, next) => {
  const now = new Date().toISOString();

  console.log(
    `[${now}] ${req.method} ${req.url} - IP: ${req.ip}`
  );

  next();
};