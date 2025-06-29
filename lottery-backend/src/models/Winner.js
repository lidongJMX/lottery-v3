const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Participant = require('./Participant');
const Award = require('./Award');

const Winner = sequelize.define('Winner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  participant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Participant,
      key: 'id'
    }
  },
  award_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Award,
      key: 'id'
    }
  },
  epoch: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  create_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

Winner.belongsTo(Participant, { foreignKey: 'participant_id' });
Winner.belongsTo(Award, { foreignKey: 'award_id' });

module.exports = Winner;