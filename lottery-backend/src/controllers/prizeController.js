const Prize = require('../models/prize');

const prizeController = {
  getAll: async (req, res) => {
    try {
      const prizes = await Prize.find().maxTimeMS(15000); // 设置15秒超时
      if (!prizes || prizes.length === 0) {
        return res.status(404).json({ error: '未找到任何奖项' });
      }
      res.json(prizes);
    } catch (error) {
      console.error('获取奖项列表错误:', error);
      if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
        return res.status(504).json({ error: '数据库查询超时，请稍后再试' });
      }
      res.status(500).json({ error: '获取奖项列表失败' });
    }
  },
  
  getById: async (req, res) => {
    try {
      const prize = await Prize.findById(req.params.id);
      if (!prize) {
        return res.status(404).json({ error: '奖项不存在' });
      }
      res.json(prize);
    } catch (error) {
      console.error('获取奖项错误:', error);
      res.status(500).json({ error: '获取奖项失败' });
    }
  },
  
  create: async (req, res) => {
    try {
      const prize = await Prize.create(req.body);
      res.status(201).json(prize);
    } catch (error) {
      console.error('创建奖项错误:', error);
      res.status(500).json({ error: '创建奖项失败' });
    }
  },
  
  update: async (req, res) => {
    try {
      const prize = await Prize.findById(req.params.id);
      if (!prize) {
        return res.status(404).json({ error: '奖项不存在' });
      }
      await Prize.findByIdAndUpdate(req.params.id, req.body);
      res.json(prize);
    } catch (error) {
      console.error('更新奖项错误:', error);
      res.status(500).json({ error: '更新奖项失败' });
    }
  },
  
  delete: async (req, res) => {
    try {
      const prize = await Prize.findById(req.params.id);
      if (!prize) {
        return res.status(404).json({ error: '奖项不存在' });
      }
      await Prize.findByIdAndDelete(req.params.id);
      res.status(204).end();
    } catch (error) {
      console.error('删除奖项错误:', error);
      res.status(500).json({ error: '删除奖项失败' });
    }
  }
};

module.exports = prizeController;