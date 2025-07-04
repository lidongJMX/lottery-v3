const { DataTypes, Sequelize } = require('sequelize');
const Participant = require('../models/Participant');
const Award = require('../models/Award');
const Winner = require('../models/Winner'); // 添加Winner模型引入
const ExcelJS = require('exceljs');// 添加这行来引入ExcelJS
const sequelize = require('../config/database'); // 添加这行来引入sequelize

const winnerController = {
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await Winner.findAndCountAll({
        include: [
          { model: Participant, attributes: ['name', 'user_code', 'department'] },
          { model: Award, attributes: ['name', 'level'] }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['epoch', 'DESC'], ['create_time', 'DESC']]
      });

      res.json({
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        data: rows
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  },

  delete: async (req, res) => {
    let transaction;
    try {
      // 开始事务
      transaction = await sequelize.transaction();

      // 根据participant的user_code查找中奖记录
      const winner = await Winner.findOne({
        include: [
          {
            model: Participant,
            where: { user_code: req.params.id }
          },
          { model: Award }
        ],
        transaction
      });
      console.log('winner', winner)
      if (!winner) {
        await transaction.rollback();
        return res.status(404).json({ message: '中奖记录不存在' });
      }

      // 计算更新后的参与者信息
      const newWinCount = winner.Participant.win_count - 1;

      // 查找该参与者其他中奖记录中的最高奖项等级
      const maxAwardResult = await Winner.findOne({
        where: { 
          participant_id: winner.participant_id,
          id: { [Sequelize.Op.ne]: winner.id }
        },
        include: [{ model: Award, attributes: ['level'] }],
        order: [[{ model: Award }, 'level', 'ASC']],
        transaction
      });
      
      const newHighAwardLevel = maxAwardResult ? maxAwardResult.Award.level : 0;
      
      // 删除中奖记录
      await winner.destroy({ transaction });
      
      // 更新参与者状态
      await winner.Participant.update({
        win_count: newWinCount,
        has_won: newWinCount > 0,
        high_award_level: newHighAwardLevel
      }, { transaction });
      
      // 更新奖项剩余数量
      await winner.Award.update({
        remaining_count: winner.Award.remaining_count + 1
      }, { transaction });

      // 提交事务
      await transaction.commit();
      
      res.json({ message: '删除成功' });
      
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      res.status(500).json({ message: '删除失败: ' + error.message });
    }
  },
  exportWinners: async (req, res) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('中奖名单');

      // 设置表头
      worksheet.columns = [
        { header: '姓名', key: 'name', width: 15 },
        { header: '工号', key: 'user_code', width: 15 },
        { header: '部门', key: 'department', width: 20 },
        { header: '奖项', key: 'award_name', width: 15 },
        { header: '轮次', key: 'epoch', width: 10 },
        { header: '中奖时间', key: 'create_time', width: 20 }
      ];

      // 获取中奖记录
      const winners = await Winner.findAll({
        include: [
          { model: Participant, attributes: ['name', 'user_code', 'department'] },
          { model: Award, attributes: ['name'] }
        ],
        order: [['epoch', 'ASC'], ['create_time', 'ASC']]
      });

      // 添加数据
      winners.forEach(winner => {
        worksheet.addRow({
          name: winner.Participant.name,
          user_code: winner.Participant.user_code,
          department: winner.Participant.department,
          award_name: winner.Award.name,
          epoch: winner.epoch,
          create_time: winner.create_time
        });
      });

      // 设置响应头
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=winners.xlsx'
      );

      // 发送文件
      await workbook.xlsx.write(res);
      console.log('导出成功');
      res.end();
    } catch (error) {
      console.error('导出中奖名单错误:', error);
      res.status(500).json({
        success: false,
        message: '导出失败：' + (error.message || '服务器错误')
      });
    }
  }
};

module.exports = winnerController;