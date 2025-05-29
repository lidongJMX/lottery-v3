const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');

const adminController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const admin = await Admin.findOne({ where: { username } });
      if (!admin) {
        return res.status(401).json({ message: '用户名或密码错误' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: '用户名或密码错误' });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        admin: {
          id: admin.id,
          username: admin.username
        }
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }
};

module.exports = adminController; 