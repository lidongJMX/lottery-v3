const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('string', 'boolean', 'number', 'json'),
    allowNull: false,
    defaultValue: 'string'
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Settings',
  timestamps: true
});

// 静态方法：获取设置值
Settings.getValue = async function(key, defaultValue = null) {
  try {
    const setting = await this.findOne({ where: { key } });
    if (!setting) return defaultValue;
    
    // 根据类型转换值
    switch (setting.type) {
      case 'boolean':
        return setting.value === 'true';
      case 'number':
        return parseFloat(setting.value);
      case 'json':
        return JSON.parse(setting.value);
      default:
        return setting.value;
    }
  } catch (error) {
    console.error('获取设置失败:', error);
    return defaultValue;
  }
};

// 静态方法：设置值
Settings.setValue = async function(key, value, type = 'string', description = null) {
  try {
    let stringValue;
    
    // 根据类型转换为字符串存储
    switch (type) {
      case 'boolean':
        stringValue = value ? 'true' : 'false';
        break;
      case 'number':
        stringValue = value.toString();
        break;
      case 'json':
        stringValue = JSON.stringify(value);
        break;
      default:
        stringValue = value;
    }
    
    const [setting, created] = await this.findOrCreate({
      where: { key },
      defaults: {
        key,
        value: stringValue,
        type,
        description
      }
    });
    
    if (!created) {
      setting.value = stringValue;
      setting.type = type;
      if (description) setting.description = description;
      await setting.save();
    }
    
    return setting;
  } catch (error) {
    console.error('设置值失败:', error);
    throw error;
  }
};

// 静态方法：获取所有设置
Settings.getAllSettings = async function() {
  try {
    const settings = await this.findAll();
    const result = {};
    
    settings.forEach(setting => {
      let value;
      switch (setting.type) {
        case 'boolean':
          value = setting.value === 'true';
          break;
        case 'number':
          value = parseFloat(setting.value);
          break;
        case 'json':
          value = JSON.parse(setting.value);
          break;
        default:
          value = setting.value;
      }
      result[setting.key] = value;
    });
    
    return result;
  } catch (error) {
    console.error('获取所有设置失败:', error);
    return {};
  }
};

module.exports = Settings;