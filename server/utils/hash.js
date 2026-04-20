import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;


// パスワードをハッシュ化
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};


// パスワードを比較
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};