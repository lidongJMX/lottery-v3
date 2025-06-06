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
      // console.log('查看formattedWinners的内容:', formattedWinners); // 添加调试日志，查看formattedWinners的内容
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
      const { awards_to_draw } = req.body;
      const currentEpoch = await Epoch.findOne({ transaction });

      // 获取所有参与者
      // 获取所有未中奖参与者
      const notWon = await Participant.findAll({
        where: { has_won: false },
        transaction
      });

      // 获取上一轮的中奖者（而不是所有已中奖者）
      const lastRoundWinners = await Winner.findAll({
        where: { epoch: currentEpoch.epoch }, // 获取当前轮次的中奖者作为"上一轮"
        include: [{ model: Participant }],
        transaction
      });

      // 从上一轮中奖者中随机选择10%参与本轮抽奖
      const lastRoundParticipants = lastRoundWinners.map(winner => winner.Participant);
      const hasWon = lastRoundParticipants.sort(() => 0.5 - Math.random())
        .slice(0, Math.ceil(lastRoundParticipants.length * 0.1));

      console.log('查看hasWon的内容:', hasWon.length);
      const participants = [...notWon, ...hasWon];

      // 计算总奖品数量
      const totalPrizes = awards_to_draw.reduce((sum, award) => sum + award.draw_count, 0);
      const totalParticipants = participants.length;

      console.log(`总奖品数: ${totalPrizes}, 总参与人数: ${totalParticipants}`);

      // 验证输入
      if (!Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ message: '参与者列表无效' });
      }
      if (!Array.isArray(awards_to_draw) || awards_to_draw.length === 0) {
        return res.status(400).json({ message: '奖项列表无效' });
      }

      const allWinners = [];
      const updatedAwards = [];
      const selectedParticipants = new Set();

      // 跟踪未中奖人员
      let neverWonParticipants = participants.filter(p => p.win_count === 0);
      let remainingPrizes = totalPrizes;

      // 遍历每个奖项进行抽奖
      for (const awardItem of awards_to_draw) {
        const { id: awardId, draw_count: drawCount } = awardItem;
        console.log(`开始处理奖项: ${awardId} (${awardItem.name})，抽奖次数: ${drawCount}`);

        if (isNaN(drawCount) || drawCount <= 0) {
          console.error('无效的抽奖次数:', drawCount);
          continue;
        }

        const award = await Award.findByPk(awardId, { transaction });
        if (!award || isNaN(award.remaining_count) || award.remaining_count <= 0) {
          console.error('无效的奖项剩余数量:', award?.remaining_count);
          continue;
        }

        // 根据规则过滤参与者
        const availableParticipants = participants.filter(p => {
          if (selectedParticipants.has(p.id)) return false;
          if (p.win_count >= 3) return false;
          if (p.high_award_level === 1) {
            if (p.win_count >= 2) return false;
            if (award.level === 1) return false;
          }
          return true;
        });

        const actualDrawCount = Math.min(
          Number(drawCount),
          Number(award.remaining_count),
          availableParticipants.length
        );

        if (isNaN(actualDrawCount) || actualDrawCount <= 0) {
          console.error('计算出的实际抽奖次数无效:', actualDrawCount);
          continue;
        }

        console.log('查看实际抽奖次数actualDrawCount:', actualDrawCount);

        // === 改进的公平抽奖算法（保证全覆盖）===
        const winners = [];

        // 更新未中奖人员列表（排除已在本轮选中的）
        const currentNeverWon = neverWonParticipants.filter(p =>
          availableParticipants.some(ap => ap.id === p.id)
        );

        // 计算是否需要优先保证未中奖者
        const shouldPrioritizeNeverWon = remainingPrizes >= currentNeverWon.length && currentNeverWon.length > 0;

        console.log(`当前未中奖人数: ${currentNeverWon.length}, 剩余奖品: ${remainingPrizes}, 是否优先未中奖者: ${shouldPrioritizeNeverWon}`);

        // 分层参与者
        const layers = {
          never_won: availableParticipants.filter(p => p.win_count === 0),
          won_once_no_first: availableParticipants.filter(p => p.win_count === 1 && p.high_award_level !== 1),
          won_once_has_first: availableParticipants.filter(p => p.win_count === 1 && p.high_award_level === 1),
          won_twice: availableParticipants.filter(p => p.win_count === 2)
        };

        // 动态调整分层比例
        let layerRatios;
        if (shouldPrioritizeNeverWon) {
          // 当奖品充足时，优先保证未中奖者全覆盖
          const neverWonRatio = Math.min(0.9, currentNeverWon.length / actualDrawCount);
          layerRatios = {
            never_won: neverWonRatio,
            won_once_no_first: (1 - neverWonRatio) * 0.6,
            won_once_has_first: (1 - neverWonRatio) * 0.3,
            won_twice: (1 - neverWonRatio) * 0.1
          };
        } else {
          // 使用原有的分层比例
          if (award.level === 1) {
            layerRatios = {
              never_won: 0.8,
              won_once_no_first: 0.2,
              won_once_has_first: 0,
              won_twice: 0
            };
          } else if (award.level <= 3) {
            layerRatios = {
              never_won: 0.6,
              won_once_no_first: 0.25,
              won_once_has_first: 0.1,
              won_twice: 0.05
            };
          } else {
            layerRatios = {
              never_won: 0.5,
              won_once_no_first: 0.3,
              won_once_has_first: 0.15,
              won_twice: 0.05
            };
          }
        }

        // 执行分层抽奖
        for (let draw = 0; draw < actualDrawCount; draw++) {
          let selectedLayer = null;
          let selectedParticipant = null;

          // 特殊处理：如果是最后几轮且还有未中奖者，直接选择未中奖者
          if (shouldPrioritizeNeverWon && layers.never_won.length > 0 &&
            remainingPrizes - draw <= currentNeverWon.length) {
            selectedLayer = layers.never_won;
            console.log(`优先模式：直接选择未中奖者 (剩余奖品: ${remainingPrizes - draw}, 未中奖人数: ${currentNeverWon.length})`);
          } else {
            // 按概率选择层级
            const rand = Math.random();
            let cumulativeRatio = 0;

            for (const [layerName, ratio] of Object.entries(layerRatios)) {
              cumulativeRatio += ratio;
              if (rand <= cumulativeRatio && layers[layerName].length > 0) {
                selectedLayer = layers[layerName];
                break;
              }
            }
          }

          // 回退机制
          if (!selectedLayer || selectedLayer.length === 0) {
            selectedLayer = layers.never_won.length > 0 ? layers.never_won :
              layers.won_once_no_first.length > 0 ? layers.won_once_no_first :
                layers.won_once_has_first.length > 0 ? layers.won_once_has_first :
                  layers.won_twice;
          }

          if (!selectedLayer || selectedLayer.length === 0) {
            console.error('没有可用的参与者');
            break;
          }

          // 在选定层级内随机选择参与者
          const winnerIndex = Math.floor(Math.random() * selectedLayer.length);
          selectedParticipant = selectedLayer[winnerIndex];

          winners.push(selectedParticipant);
          selectedParticipants.add(selectedParticipant.id);

          // 从未中奖列表中移除
          if (selectedParticipant.win_count === 0) {
            neverWonParticipants = neverWonParticipants.filter(p => p.id !== selectedParticipant.id);
          }

          console.log(`第${draw + 1}次抽奖: 从${Object.keys(layers).find(key => layers[key] === selectedLayer)}层选中 ${selectedParticipant.name} (当前中奖${selectedParticipant.win_count}次，最高奖级${selectedParticipant.high_award_level || '无'})`);

          // 从所有层级中移除中奖者
          Object.values(layers).forEach(layer => {
            const index = layer.findIndex(p => p.id === selectedParticipant.id);
            if (index !== -1) layer.splice(index, 1);
          });
        }

        // 更新剩余奖品数
        remainingPrizes -= winners.length;

        // ... 其余代码保持不变（记录中奖信息、更新参与者状态等）
        await Promise.all(winners.map(winner =>
          Winner.create({
            participant_id: winner.id,
            award_id: award.id,
            epoch: currentEpoch.epoch + 1
          }, { transaction })
        ));

        await Promise.all(winners.map(winner =>
          Participant.update(
            {
              has_won: true,
              win_count: sequelize.literal('win_count + 1'),
              high_award_level: sequelize.literal(
                `(CASE WHEN high_award_level IS NULL OR high_award_level > ${award.level} THEN ${award.level} ELSE high_award_level END)`
              )
            },
            {
              where: { id: winner.id },
              transaction
            }
          )
        ));

        await Award.update(
          { remaining_count: award.remaining_count - winners.length },
          { where: { id: award.id }, transaction }
        );

        allWinners.push(...winners.map(winner => ({
          participant_id: winner.id,
          name: winner.name,
          award_id: award.id,
          award_name: award.name,
          win_count: winner.win_count + 1,
          previous_high_award: winner.high_award_level
        })));

        updatedAwards.push({
          id: award.id,
          name: award.name,
          remaining_count: award.remaining_count - winners.length
        });
      }

      // 最终检查：如果还有奖品且有未中奖者，给出警告
      if (remainingPrizes > 0 && neverWonParticipants.length > 0) {
        console.warn(`警告：仍有 ${neverWonParticipants.length} 人未中奖，剩余奖品 ${remainingPrizes}`);
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
        updated_awards: updatedAwards,
        coverage_info: {
          total_participants: totalParticipants,
          total_prizes: totalPrizes,
          never_won_remaining: neverWonParticipants.length
        }
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
        { has_won: false, win_count: 0, high_award_level: 100 },
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
    } catch (error) {
      await transaction.rollback();
      console.error('清除数据库失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
};

module.exports = lotteryController;