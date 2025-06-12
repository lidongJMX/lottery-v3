const Settings = require('../models/Settings');

// 获取所有设置
const getAllSettings = async (req, res) => {
  try {
    const settings = await Settings.getAllSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取设置失败',
      error: error.message
    });
  }
};

// 获取单个设置
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const value = await Settings.getValue(key);
    
    res.json({
      success: true,
      data: {
        key,
        value
      }
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取设置失败',
      error: error.message
    });
  }
};

// 设置单个值
const setSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, type = 'string', description } = req.body;
    
    const setting = await Settings.setValue(key, value, type, description);
    
    res.json({
      success: true,
      message: '设置保存成功',
      data: setting
    });
  } catch (error) {
    console.error('保存设置失败:', error);
    res.status(500).json({
      success: false,
      message: '保存设置失败',
      error: error.message
    });
  }
};

// 批量设置
const setMultipleSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: '设置数据格式错误'
      });
    }
    
    const results = [];
    
    for (const setting of settings) {
      const { key, value, type = 'string', description } = setting;
      const result = await Settings.setValue(key, value, type, description);
      results.push(result);
    }
    
    res.json({
      success: true,
      message: '批量设置保存成功',
      data: results
    });
  } catch (error) {
    console.error('批量保存设置失败:', error);
    res.status(500).json({
      success: false,
      message: '批量保存设置失败',
      error: error.message
    });
  }
};

// 删除设置
const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const deleted = await Settings.destroy({
      where: { key }
    });
    
    if (deleted) {
      res.json({
        success: true,
        message: '设置删除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '设置不存在'
      });
    }
  } catch (error) {
    console.error('删除设置失败:', error);
    res.status(500).json({
      success: false,
      message: '删除设置失败',
      error: error.message
    });
  }
};

// 初始化默认设置
const initializeDefaultSettings = async (req, res) => {
  try {
    const defaultSettings = [
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
    ];
    
    const results = [];
    
    for (const setting of defaultSettings) {
      // 只有当设置不存在时才创建
      const existing = await Settings.findOne({ where: { key: setting.key } });
      if (!existing) {
        const result = await Settings.setValue(
          setting.key,
          setting.value,
          setting.type,
          setting.description
        );
        results.push(result);
      }
    }
    
    res.json({
      success: true,
      message: '默认设置初始化完成',
      data: results
    });
  } catch (error) {
    console.error('初始化默认设置失败:', error);
    res.status(500).json({
      success: false,
      message: '初始化默认设置失败',
      error: error.message
    });
  }
};

module.exports = {
  getAllSettings,
  getSetting,
  setSetting,
  setMultipleSettings,
  deleteSetting,
  initializeDefaultSettings
};