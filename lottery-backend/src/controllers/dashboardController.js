const Winner = require('../models/Winner');
const Participant = require('../models/Participant');
const Award = require('../models/Award');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const dashboardController = {
  // 获取仪表盘统计数据
  getStats: async (req, res) => {
    try {
      // 获取参与人数
      const participantCount = await Participant.count();
      
      // 获取奖项数量
      const awardCount = await Award.count();
      
      // 获取已中奖人数（去重）
      const winnerCount = await Winner.count({
        distinct: true,
        col: 'participant_id'
      });
      
      // 获取抽奖轮次
      const maxRound = await Winner.max('epoch') || 0;
      
      res.json({
        participantCount,
        awardCount,
        winnerCount,
        roundCount: maxRound
      });
    } catch (error) {
      console.error('获取仪表盘统计数据失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  },

  // 获取中奖分布数据
  getWinnerDistribution: async (req, res) => {
    try {
      const participantCount = await Participant.count();
      const winnerCount = await Winner.count({
        distinct: true,
        col: 'participant_id'
      });
      
      const data = [
        { 
          name: '已中奖', 
          value: winnerCount, 
          itemStyle: { color: '#67c23a' } 
        },
        { 
          name: '未中奖', 
          value: participantCount - winnerCount, 
          itemStyle: { color: '#e6a23c' } 
        }
      ];
      
      res.json(data);
    } catch (error) {
      console.error('获取中奖分布数据失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  },

  // 获取部门统计数据
  getDepartmentStats: async (req, res) => {
    try {
      // 获取所有部门的参与人数
      const departmentParticipants = await Participant.findAll({
        attributes: [
          'department',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_count']
        ],
        group: ['department'],
        raw: true
      });
      
      // 获取各部门中奖人数
      const departmentWinners = await Winner.findAll({
        attributes: [
          [sequelize.col('Participant.department'), 'department'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('participant_id'))), 'winner_count']
        ],
        include: [{
          model: Participant,
          attributes: []
        }],
        group: [sequelize.col('Participant.department')],
        raw: true
      });
      
      // 合并数据
      const departments = [];
      const winnerCounts = [];
      const totalCounts = [];
      
      departmentParticipants.forEach(dept => {
        const winnerData = departmentWinners.find(w => w.department === dept.department);
        departments.push(dept.department);
        totalCounts.push(parseInt(dept.total_count));
        winnerCounts.push(winnerData ? parseInt(winnerData.winner_count) : 0);
      });
      
      res.json({
        departments,
        winnerCounts,
        totalCounts
      });
    } catch (error) {
      console.error('获取部门统计数据失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  },

  // 获取奖项统计数据
  getAwardStats: async (req, res) => {
    try {
      const awards = await Award.findAll({
        attributes: ['id', 'name', 'level', 'count', 'remaining_count']
      });
      
      const data = awards.map(award => {
        const usedCount = award.count - award.remaining_count;
        const colors = ['#f56c6c', '#e6a23c', '#67c23a', '#909399'];
        
        return {
          name: award.name,
          value: usedCount,
          total: award.count,
          itemStyle: { color: colors[award.level - 1] || '#409eff' }
        };
      });
      
      res.json(data);
    } catch (error) {
      console.error('获取奖项统计数据失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  },

  // 获取部门人员分布数据
  getDepartmentDistribution: async (req, res) => {
    try {
      const departmentStats = await Participant.findAll({
        attributes: [
          'department',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['department'],
        raw: true
      });
      
      const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#c45656', '#8e44ad', '#3498db'];
      
      const data = departmentStats.map((dept, index) => ({
        name: dept.department,
        value: parseInt(dept.count),
        itemStyle: { color: colors[index % colors.length] }
      }));
      
      res.json(data);
    } catch (error) {
      console.error('获取部门人员分布数据失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  },

  // 获取部门中奖率数据
  getDepartmentWinRate: async (req, res) => {
    try {
      // 获取所有部门的参与人数
      const departmentParticipants = await Participant.findAll({
        attributes: [
          'department',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_count']
        ],
        group: ['department'],
        raw: true
      });
      
      // 获取各部门中奖人数
      const departmentWinners = await Winner.findAll({
        attributes: [
          [sequelize.col('Participant.department'), 'department'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('participant_id'))), 'winner_count']
        ],
        include: [{
          model: Participant,
          attributes: []
        }],
        group: [sequelize.col('Participant.department')],
        raw: true
      });
      
      const colors = ['#67c23a', '#409eff', '#e6a23c', '#f56c6c', '#909399', '#c45656', '#8e44ad', '#3498db'];
      
      const data = departmentParticipants.map((dept, index) => {
        const winnerData = departmentWinners.find(w => w.department === dept.department);
        const totalCount = parseInt(dept.total_count);
        const winnerCount = winnerData ? parseInt(winnerData.winner_count) : 0;
        const winRate = totalCount > 0 ? ((winnerCount / totalCount) * 100) : 0;
        
        return {
          name: dept.department,
          value: parseFloat(winRate.toFixed(1)),
          total: totalCount,
          winners: winnerCount,
          itemStyle: { color: colors[index % colors.length] }
        };
      });
      
      res.json(data);
    } catch (error) {
      console.error('获取部门中奖率数据失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  },

  // 获取中奖趋势数据
  getWinnerTrend: async (req, res) => {
    try {
      const { type = 'daily' } = req.query;
      let data = [];
      
      if (type === 'daily') {
        // 按日统计最近7天
        const winners = await Winner.findAll({
          attributes: [
            [sequelize.fn('DATE', sequelize.col('create_time')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where: {
            create_time: {
              [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          group: [sequelize.fn('DATE', sequelize.col('create_time'))],
          order: [[sequelize.fn('DATE', sequelize.col('create_time')), 'ASC']],
          raw: true
        });
        
        // 填充缺失的日期
        for (let i = 6; i >= 0; i--) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];
          const found = winners.find(w => w.date === dateStr);
          
          data.push({
            time: `${date.getMonth() + 1}-${date.getDate()}`,
            count: found ? parseInt(found.count) : 0
          });
        }
      } else if (type === 'hourly') {
        // 按小时统计今天
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const winners = await Winner.findAll({
          attributes: [
            [sequelize.fn('HOUR', sequelize.col('create_time')), 'hour'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          where: {
            create_time: {
              [Op.gte]: today
            }
          },
          group: [sequelize.fn('HOUR', sequelize.col('create_time'))],
          order: [[sequelize.fn('HOUR', sequelize.col('create_time')), 'ASC']],
          raw: true
        });
        
        // 填充24小时数据
        for (let i = 0; i < 24; i++) {
          const found = winners.find(w => parseInt(w.hour) === i);
          data.push({
            time: `${i}:00`,
            count: found ? parseInt(found.count) : 0
          });
        }
      } else if (type === 'round') {
        // 按轮次统计
        const winners = await Winner.findAll({
          attributes: [
            'round',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['round'],
          order: [['round', 'ASC']],
          raw: true
        });
        
        data = winners.map(w => ({
          time: `第${w.round}轮`,
          count: parseInt(w.count)
        }));
      }
      
      res.json(data);
    } catch (error) {
      console.error('获取中奖趋势数据失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
};

module.exports = dashboardController;