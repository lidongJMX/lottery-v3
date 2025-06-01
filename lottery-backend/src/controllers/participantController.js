const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const Participant = require('../models/Participant');
const sequelize = require('../config/database');

const participantController = {
  getLotteryParticipants: async (req, res) => {
    try {
      // 获取未中奖用户
      const notWon = await Participant.findAll({
        where: { has_won: false }
      });
      
      // 获取50%的已中奖用户
      const allWon = await Participant.findAll({
        where: { has_won: true }
      });
      
      const hasWon = allWon.sort(() => 0.5 - Math.random()).slice(0, Math.ceil(allWon.length * 0.1));
      
      const participants = [...notWon, ...hasWon];
      
      res.json(participants);
    } catch (error) {
      console.error('获取抽奖名单错误:', error);
      res.status(500).json({ error: '获取抽奖名单失败' });
    }
  },
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { user_code: { [Op.like]: `%${search}%` } },
          { department: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Participant.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['id', 'ASC']]
      });

      res.json(rows);
    } catch (error) {
      await t.rollback();
      console.error('导入参与者数据错误:', error);
      res.status(500).json({ 
        success: false, 
        message: '导入失败：' + (error.message || '服务器错误')
      });
    }
  },

  import: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const participants = req.body;
      console.log('导入数据:', participants);
      if (!Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ success: false, message: '无效的数据格式' });
      }

      // 验证必要字段
      const invalidData = participants.some(p => !p.name || !p.user_code || !p.department);
      if (invalidData) {
        return res.status(400).json({ success: false, message: '数据格式不完整，请确保包含姓名、用户编码和部门字段' });
      }

      // 转换数据格式
      const formattedParticipants = participants.map(p => ({
        name: p.name,
        user_code: p.user_code,
        department: p.department,
        weight: 1,
        has_won: false,
        win_count: 0,
        high_award_level: 0
      }));

      // 批量创建或更新参与者
      const result = await Participant.bulkCreate(formattedParticipants, {
        updateOnDuplicate: ['name', 'department', 'weight'],
        transaction: t
      });

      await t.commit();

      res.json({
        success: true,
        message: '数据导入成功',
        data: result.map(p => ({
          id: p.id,
          name: p.name,
          user_code: p.user_code,
          department: p.department,
          weight: p.weight
        }))
      });
    } catch (error) {
      await t.rollback();
      console.error('导入参与者数据错误:', error);
      res.status(500).json({ 
        success: false, 
        message: '导入失败：' + (error.message || '服务器错误')
      });
    }
  },

  
};

module.exports = participantController;