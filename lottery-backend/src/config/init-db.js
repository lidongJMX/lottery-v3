const sequelize = require('./database');
const Admin = require('../models/Admin');
const Award = require('../models/Award');
const Participant = require('../models/Participant');
const Winner = require('../models/Winner');
const Epoch = require('../models/Epoch');
const Settings = require('../models/Settings');

const initDatabase = async () => {
  try {
    // 同步所有模型到数据库，不强制重建表
    await sequelize.sync({ force: false });

    // 创建初始管理员账号（如果不存在）
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      await Admin.create({
        username: 'admin',
        password: 'admin123'
      });
    }

    // 创建初始奖项（如果不存在）
    const awardCount = await Award.count();
    if (awardCount === 0) {
      await Award.bulkCreate([
      {
        name: '特等奖',
        description: '最高奖项',
        count: 1,
        remaining_count: 1,
        level: 1
      },
      {
        name: '一等奖',
        description: '一等奖项',
        count: 3,
        remaining_count: 3,
        level: 2
      },
      {
        name: '二等奖',
        description: '二等奖项',
        count: 5,
        remaining_count: 5,
        level: 3
      },
      {
        name: '三等奖',
        description: '三等奖项',
        count: 10,
        remaining_count: 10,
        level: 4
      },
      {
        name: '参与奖',
        description: '参与奖项',
        count: 20,
        remaining_count: 20,
        level: 5
      }
    ]);
    }

    // 创建初始参与者数据（如果不存在）
    const participantCount = await Participant.count();
    if (participantCount === 0) {
      await Participant.bulkCreate([
      {
        name: '张三',
        user_code: 'ZS001',
        department: '研发部',
        weight: 1.0
      },
      {
        name: '李四',
        user_code: 'LS002',
        department: '市场部',
        weight: 1.0
      },
      {
        name: '王五',
        user_code: 'WW003',
        department: '销售部',
        weight: 1.0
      },
      {
        name: '赵六',
        user_code: 'ZL004',
        department: '人事部',
        weight: 1.0
      },
      {
        name: '孙七',
        user_code: 'SQ005',
        department: '财务部',
        weight: 1.0
      }
    ]);
    }

    // 创建初始轮次记录（如果不存在）
    const epochCount = await Epoch.count();
    if (epochCount === 1) {
      await Epoch.create({
        epoch: 1,
        current_epoch: 1,
        status: 1
      });
    }

    // 创建初始系统设置（如果不存在）
    const settingsCount = await Settings.count();
    if (settingsCount === 0) {
      await Settings.bulkCreate([
        {
          key: 'meetingTheme',
          value: '年会抽奖系统',
          type: 'string',
          description: '会议或活动的主题名称'
        },
        {
          key: 'backgroundMusicEnabled',
          value: 'false',
          type: 'boolean',
          description: '是否启用背景音乐'
        },
        {
          key: 'currentMusicUrl',
          value: '',
          type: 'string',
          description: '当前背景音乐文件URL'
        },
        {
          key: 'musicVolume',
          value: '50',
          type: 'number',
          description: '背景音乐音量（0-100）'
        },
        {
          key: 'roundLotteryEnabled',
          value: 'true',
          type: 'boolean',
          description: '是否启用轮次抽奖功能'
        }
      ]);
    }

    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败：', error);
  }
};

module.exports = initDatabase;