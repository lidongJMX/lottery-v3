const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const initDatabase = require('./config/init-db');

const app = express();

// 中间件
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 路由
app.use('/api', routes);

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器错误' });
});

// 初始化数据库
initDatabase().then(() => {
  console.log('数据库初始化完成');
}).catch(err => {
  console.error('数据库初始化失败：', err);
});

module.exports = app;