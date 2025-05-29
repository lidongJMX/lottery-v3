const Award = require('../models/Award');

const awardController = {
  getAll: async (req, res) => {
    try {
      console.log('开始获取奖项列表...');
      
      // 打印Sequelize查询信息
      console.log('Award模型信息:', {
        tableName: Award.tableName,
        schema: Award.options.schema,
        modelName: Award.name
      });
      
      // 执行查询并打印结果
      const awards = await Award.findAll({
        order: [['level', 'ASC']],
        logging: console.log // 打印SQL语句
      });
      
      console.log('查询结果条数:', awards.length);
      console.log('查询结果:', JSON.stringify(awards, null, 2));
      
      // 如果结果为空，尝试直接执行SQL
      if (awards.length === 0) {
        console.log('尝试使用原始SQL查询...');
        const sequelize = Award.sequelize;
        const [results] = await sequelize.query('SELECT * FROM Awards');
        console.log('原始SQL查询结果条数:', results.length);
        console.log('原始SQL查询结果:', JSON.stringify(results, null, 2));
        
        // 如果原始SQL有结果但模型查询没有，返回原始SQL结果
        if (results.length > 0) {
          return res.json(results);
        }
      }
      
      res.json(awards);
    } catch (error) {
      console.error('获取奖项列表失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  },

  getById: async (req, res) => {
    try {
      const award = await Award.findByPk(req.params.id);
      if (!award) {
        return res.status(404).json({ message: '奖项不存在' });
      }
      res.json(award);
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  },

  create: async (req, res) => {
    try {
      const { name, description, count, level, draw_count } = req.body;
      const award = await Award.create({
        name,
        description,
        count,
        remaining_count: count,
        level,
        draw_count: draw_count || 1 // 默认为1人
      });
      res.status(201).json(award);
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  },

  update: async (req, res) => {
    try {
      const { name, description, count, level, draw_count } = req.body;
      const award = await Award.findByPk(req.params.id);
      
      if (!award) {
        return res.status(404).json({ message: '奖项不存在' });
      }

      // 如果修改了总数，需要相应调整剩余数量
      const remainingCount = count !== undefined
        ? award.remaining_count + (count - award.count)
        : award.remaining_count;

      await award.update({
        name,
        description,
        count,
        remaining_count: remainingCount,
        level,
        draw_count: draw_count || award.draw_count
      });

      res.json(award);
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  },

  delete: async (req, res) => {
    try {
      const award = await Award.findByPk(req.params.id);
      console.log('删除奖项',award);
      if (!award) {
        return res.status(404).json({ message: '奖项不存在' });
      }

      await award.destroy();
      res.json({ message: '删除成功' });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }
};

module.exports = awardController;