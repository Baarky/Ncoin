// name=reset-db.js
const { sequelize } = require('./models');

(async () => {
  try {
    console.log('DB sync force: start');
    await sequelize.sync({ force: true }); // 全テーブルを DROP → CREATE
    console.log('DB sync force: done');
    process.exit(0);
  } catch (err) {
    console.error('reset failed:', err);
    process.exit(1);
  }
})();