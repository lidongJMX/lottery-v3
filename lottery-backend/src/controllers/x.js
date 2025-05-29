const { Op } = require('sequelize');
const Participant = require('../models/Participant');
const Award = require('../models/Award');
const Winner = require('../models/Winner');
const Epoch = require('../models/Epoch');
const sequelize = require('../config/database');
const lotteryController = {
  start: async (req, res) => {
    try {
      const currentEpoch = await Epoch.findOne();
      if (currentEpoch.status === 'running') {
        return res.status(400).json({ message: '抽奖正在进行中' });
      }

      await currentEpoch.update({ status: 'running' });
      res.json({ message: '抽奖开始' });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  },

  stop: async (req, res) => {
    try {
      const { awardId, awardName, participants, drawCount } = req.body;
      
      const currentEpoch = await Epoch.findOne();
      console.log('当前轮次', currentEpoch);
      if (!Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ message: '参与者列表无效' });
      }
      const award = await Award.findByPk(awardId);
      if (!award || award.remaining_count <= 0) {
        return res.status(400).json({ message: '奖项无效或已抽完' });
      }

      // 确保抽取人数不超过剩余奖项数量
      const actualDrawCount = Math.min(drawCount, award.remaining_count, participants.length);
      const winners = [];
      const selectedIndexes = new Set();

      for (let draw = 0; draw < actualDrawCount; draw++) {
        // 计算未选中参与者的权重
        const availableParticipants = participants.filter((_, index) => !selectedIndexes.has(index));
        const weights = availableParticipants.map(p => {
          let weight = 1.0;
          weight /= (p.win_count + 1);
          weight /= (award.level * 0.2);
          return weight;
        });

        // 根据权重随机选择中奖人
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let winnerIndex = 0;
        for (let i = 0; i < weights.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            winnerIndex = i;
            break;
          }
        }

        // 记录选中的索引
        const originalIndex = participants.indexOf(availableParticipants[winnerIndex]);
        selectedIndexes.add(originalIndex);
        winners.push(participants[originalIndex]);
      }
      console.log('中奖人已选择');
      // 批量更新中奖记录
      await Promise.all(winners.map(winner =>
        Winner.create({
          participant_id: winner.id,
          award_id: award.id,
          epoch: currentEpoch.epoch
        })
      ));

      await Promise.all(winners.map(async winner => {
        try {
          await Participant.update(
            {
              has_won: true,
              win_count: sequelize.literal('win_count + 1'),
              high_award_level: sequelize.literal(`(CASE WHEN high_award_level > ${award.level} THEN high_award_level ELSE ${award.level} END)`)
            },
            {
              where: { id: winner.id }
            }
          );
        } catch (error) {
          console.error('更新参与者失败:', winner.id, error);
          throw error;
        }
      }));

      // 使用原子操作更新奖项剩余数量
      await Award.update(
        {
          remaining_count: sequelize.literal(`remaining_count - ${actualDrawCount}`)
        },
        {
          where: { id: award.id }
        }
      );

      // 使用原子操作更新轮次状态
      try {
        console.log('当前轮次ID:', currentEpoch.epoch_id); // 添加调试日志
        await Epoch.update(
          {
            status: 0,  // 使用数字状态值
            epoch: sequelize.literal('epoch + 1')
          },
          {
            where: { epoch_id: currentEpoch.epoch_id } // 使用正确的primaryKey字段名
          }
        );
      } catch (error) {
        console.error('更新轮次状态失败:', error);
        throw error; // 重新抛出错误以便外层catch捕获
      }

      res.json({
        winners: winners.map(winner => ({
          id: winner.id,
          name: winner.name,
          user_code: winner.user_code,
          department: winner.department
        })),
        award: {
          id: award.id,
          name: award.name,
          level: award.level
        }
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  },

  reset: async (req, res) => {
    try {
      await Promise.all([
        Winner.destroy({ where: {} }),
        Participant.update(
          { has_won: false, win_count: 0, high_award_level: 0 },
          { where: {} }
        ),
        Award.update(
          { remaining_count: sequelize.col('count') },
          { where: {} }
        ),
        Epoch.update(
          { epoch: 0, status: 'idle' },
          { where: {} }
        )
      ]);

      res.json({ message: '重置成功' });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }
};

module.exports = lotteryController;