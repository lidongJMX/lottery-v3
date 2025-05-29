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

  getLatestWinners: async (req, res) => {
    try {
      console.log('进入getLatestWinners函数'); // 添加调试日志
      // 查询最大的epoch值
      const maxEpochResult = await Winner.findOne({
        attributes: [[sequelize.fn('MAX', sequelize.col('epoch')), 'maxEpoch']],
        raw: true
      });

      if (!maxEpochResult || maxEpochResult.maxEpoch === null) {
        return res.json({ winners: [] });
      }

      const maxEpoch = maxEpochResult.maxEpoch;

      // 查询最新一轮的中奖记录
      const winners = await Winner.findAll({
        where: { epoch: maxEpoch },
        include: [
          { model: Participant, attributes: ['id', 'name', 'user_code', 'department'] },
          { model: Award, attributes: ['id', 'name', 'level'] }
        ],
        order: [[sequelize.col('Award.level'), 'ASC']]
      });

      // 格式化返回数据
      const formattedWinners = winners.map(winner => ({
        participant_id: winner.participant_id,
        name: winner.Participant.name,
        user_code: winner.Participant.user_code,
        department: winner.Participant.department,
        award_id: winner.award_id,
        award_name: winner.Award.name,
        award_level: winner.Award.level,
        epoch: winner.epoch,
        create_time: winner.create_time
      }));
      console.log('查看formattedWinners的内容:', formattedWinners); // 添加调试日志，查看formattedWinners的内容
      res.json({
        epoch: maxEpoch,
        winners: formattedWinners
      });
    } catch (error) {
      console.error('获取最新一轮中奖记录失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  },

  stop: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { awards_to_draw, participants } = req.body;
      const currentEpoch = await Epoch.findOne({ transaction });

      // 验证输入
      if (!Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ message: '参与者列表无效' });
      }
      if (!Array.isArray(awards_to_draw) || awards_to_draw.length === 0) {
        return res.status(400).json({ message: '奖项列表无效' });
      }
      console.log('查看awards_to_draw的内容:', awards_to_draw); // 添加调试日志，查看awards_to_draw的内容
      console.log('查看participants的内容:', participants); // 添加调试日志，查看participants的内容
      const allWinners = [];
      const updatedAwards = [];
      const selectedParticipants = new Set();

      // 遍历每个奖项进行抽奖
      for (const awardItem of awards_to_draw) {
        const { id: awardId, draw_count: drawCount } = awardItem;
        // 添加数字验证
        if (isNaN(drawCount) || drawCount <= 0) {
          console.error('无效的抽奖次数:', drawCount);
          continue;
        }

        const award = await Award.findByPk(awardId, { transaction });
        if (!award || isNaN(award.remaining_count) || award.remaining_count <= 0) {
          console.error('无效的奖项剩余数量:', award?.remaining_count);
          continue;
        }

        // 过滤掉已中奖的参与者
        const availableParticipants = participants.filter(
          p => !selectedParticipants.has(p.id)
        );

        const actualDrawCount = Math.min(
          Number(drawCount),
          Number(award.remaining_count),
          availableParticipants.length
        );

        if (isNaN(actualDrawCount) || actualDrawCount <= 0) {
          console.error('计算出的实际抽奖次数无效:', actualDrawCount);
          continue;
        }
        console.log('查看实际抽奖次数actualDrawCount:', actualDrawCount); // 添加调试日志，查看实际抽奖次数actualDrawCount
        const winners = [];
        const weights = availableParticipants.map(p => {
          let weight = 1.0;
          weight /= (p.win_count + 1);
          weight /= (award.level * 0.2);
          return weight;
        });
        console.log('查看权重数组的内容weights:', weights); // 添加调试日志，查看权重数组的内容
        // 抽奖逻辑
        for (let draw = 0; draw < actualDrawCount; draw++) {
          const totalWeight = weights.reduce((a, b) => a + b, 0);
          let random = Math.random() * totalWeight;
          let winnerIndex = 0;
          console.log('查看random:', random); // 添加调试日志，查看权重数组的内容
          for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
              winnerIndex = i;
              break;
            }
          }

          const winner = availableParticipants[winnerIndex];
          console.log('查看当前中奖者winner:', winner); // 添加调试日志，查看当前中奖者winner
          winners.push(winner);
          selectedParticipants.add(winner.id);

          // 从权重数组中移除已中奖者
          weights.splice(winnerIndex, 1);
          availableParticipants.splice(winnerIndex, 1);
        }

        // 记录中奖信息
        await Promise.all(winners.map(winner =>
          Winner.create({
            participant_id: winner.id,
            award_id: award.id,
            epoch: currentEpoch.epoch + 1
          }, { transaction })
        ));

        // 更新参与者状态
        await Promise.all(winners.map(winner =>
          Participant.update(
            {
              has_won: true,
              win_count: sequelize.literal('win_count + 1'),
              high_award_level: sequelize.literal(
                `(CASE WHEN high_award_level > ${award.level} THEN high_award_level ELSE ${award.level} END)`
              )
            },
            {
              where: { id: winner.id },
              transaction
            }
          )
        ));

        // 更新奖项信息
        await Award.update(
          { remaining_count: award.remaining_count - winners.length },
          { where: { id: award.id }, transaction }
        );

        allWinners.push(...winners.map(winner => ({
          participant_id: winner.id,
          name: winner.name,
          award_id: award.id,
          award_name: award.name
        })));

        updatedAwards.push({
          id: award.id,
          name: award.name,
          remaining_count: award.remaining_count - winners.length
        });
      }

      // 更新轮次状态
      await Epoch.update(
        {
          status: 0,
          epoch: sequelize.literal('epoch + 1')
        },
        {
          where: { epoch_id: currentEpoch.epoch_id },
          transaction
        }
      );

      await transaction.commit();

      res.json({
        success: true,
        winners: allWinners,
        updated_awards: updatedAwards
      });

    } catch (error) {
      await transaction.rollback();
      console.error('抽奖出错:', error);
      res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message
      });
    }
  },

  reset: async (req, res) => {
    const transaction = await sequelize.transaction();
    console.log('进入reset函数'); // 添加调试日志
    try {
      const transaction = await sequelize.transaction();
      await Winner.destroy({ where: {}, transaction });
      console.log('重置Winner表成功'); // 添加调试日志
      await Participant.update(
        { has_won: false, win_count: 0, high_award_level: 0 },
        { where: {}, transaction }
      );
      console.log('重置Participant表成功'); // 添加调试日志
      await Award.update(
        { remaining_count: sequelize.col('count') },
        { where: {}, transaction }
      );
      console.log('重置Award表成功'); // 添加调试日志
      await Epoch.update(
        { epoch: 0, status: 'idle' },
        { where: {}, transaction }
      );
      console.log('重置Epoch表成功'); // 添加调试日志
      console.log('重置数据库成功');
      await transaction.commit();
      res.json({ message: '重置成功' });
    } catch (error) {
      await transaction.rollback();
      console.error('重置数据库失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  },

  clearAllData: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      await Winner.destroy({ where: {}, transaction });
      console.log('清除Winner表成功'); // 添加调试日志
      await Participant.destroy({ where: {}, transaction });
      console.log('清除Participant表成功'); // 添加调试日志
      await Award.update(
        { remaining_count: sequelize.col('count') },
        { where: {}, transaction }
      );
      console.log('重置Award表成功'); // 添加调试日志
      await Epoch.update(
        { epoch: 0, status: 'idle' },
        { where: {}, transaction }
      );
      console.log('重置Epoch表成功'); // 添加调试日志
      await transaction.commit();
      res.json({ message: '清除成功' });
    }catch (error) {
      await transaction.rollback();
      console.error('清除数据库失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
};

module.exports = lotteryController;