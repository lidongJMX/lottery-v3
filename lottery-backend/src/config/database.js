const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false,
  dialectOptions: {
    // SQLite特定配置
    timeout: 30000, // 设置busy_timeout为30秒
  },
  pool: {
    max: 5, // 连接池最大连接数
    min: 0, // 连接池最小连接数
    acquire: 30000, // 获取连接的超时时间
    idle: 10000 // 连接在释放前可以空闲的最长时间
  }
});

module.exports = sequelize;