const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false,
  dialectOptions: {
    // SQLite特定配置
    timeout: 30000, // 设置busy_timeout为30秒
    // 启用WAL模式以提高并发性能
    mode: 'WAL'
  },
  pool: {
    max: 3, // 减少连接池最大连接数，避免SQLite锁竞争
    min: 0, // 连接池最小连接数
    acquire: 30000, // 获取连接的超时时间
    idle: 10000, // 连接在释放前可以空闲的最长时间
    evict: 1000 // 每1秒检查一次空闲连接
  },
  retry: {
    match: [
      /SQLITE_BUSY/,
      /database is locked/
    ],
    max: 3
  }
});

module.exports = sequelize;