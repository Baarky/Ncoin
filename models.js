const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
  logging: false
});

const User = sequelize.define("User", {
  googleId: { type: DataTypes.STRING, unique: true },
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  username: DataTypes.STRING      // ←追加
});

const Wallet = sequelize.define("Wallet", {
  balance: { type: DataTypes.INTEGER, defaultValue: 1000 }
});

User.hasOne(Wallet);
Wallet.belongsTo(User);

module.exports = { sequelize, User, Wallet };
