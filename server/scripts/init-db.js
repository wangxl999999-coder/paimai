require('dotenv').config();
const sequelize = require('../config/database');

(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('数据库初始化完成');
    await require('./init-admin')();
    process.exit(0);
  } catch (err) {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  }
})();
