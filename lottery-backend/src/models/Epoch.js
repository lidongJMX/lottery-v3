const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Epoch = sequelize.define('Epoch', {
  epoch_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  epoch: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('idle', 'running', 'paused', 'completed'), // 使用字符串枚举
    allowNull: false,
    defaultValue: 'idle',
    comment: '状态: idle-空闲/未开始, running-运行中, paused-已暂停, completed-已完成'
  }
});

module.exports = Epoch;