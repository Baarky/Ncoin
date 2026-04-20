// server/utils/validator.js

export const validateUsername = (username) => {
  return typeof username === "string" && username.length >= 3 && username.length <= 20;
};

export const validatePassword = (password) => {
  return typeof password === "string" && password.length >= 6;
};

export const validateAmount = (amount) => {
  return typeof amount === "number" && amount > 0;
};