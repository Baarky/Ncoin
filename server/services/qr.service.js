import QRCode from "qrcode";
import jwt from "jsonwebtoken";

const SECRET = process.env.QR_SECRET || "secret";

export const generateQR = async (username, amount) => {
  const payload = {
    type: "send",
    to: username,
    amount: amount
  };

  const token = jwt.sign(payload, SECRET, {
    expiresIn: "5m" // 有効期限
  });

  const qr = await QRCode.toDataURL(token);

  return qr;
};