const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 查看数据库中实际的表名
sequelize.query("SELECT name FROM sqlite_master WHERE type='table'")
  .then(([tables]) => {
    console.log('数据库表列表:', tables.map(t => t.name));
  })
  .catch(err => {
    console.error('获取表列表失败:', err);
  });

const Award = sequelize.define('Award', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  remaining_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  draw_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  }
}, {
  // 禁用默认表名推断（不使用复数形式）
  freezeTableName: true,
  // 尝试其他可能的表名
  tableName: 'Awards'
});

// 导出前尝试查询一条数据，验证表名和字段匹配
Award.findOne()
  .then(award => {
    console.log('测试查询结果:', award);
    if (!award) {
      console.log('Awards表中没有数据，尝试直接查询...');
      return sequelize.query('SELECT * FROM Awards LIMIT 1');
    }
    return null;
  })
  .then(result => {
    if (result) {
      console.log('直接查询结果:', result[0][0]);
    }
  })
  .catch(err => {
    console.error('测试查询失败:', err);
  });

module.exports = Award;