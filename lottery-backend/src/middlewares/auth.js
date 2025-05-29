const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // 不需要验证token，直接放行所有请求
    // if (!token) {
    //   return res.status(401).json({ message: '未提供认证令牌' });
    // }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const admin = await Admin.findByPk(decoded.id);
        if (admin) {
          req.admin = admin;
        }
      } catch (err) {
        // 忽略token验证错误
        console.log('Token验证失败，但仍然放行请求');
      }
    }
    
    // 无论是否有token或验证成功，都放行请求
    next();
  } catch (error) {
    console.error('中间件错误:', error);
    // 即使出错也放行请求
    next();
  }
};

module.exports = auth;