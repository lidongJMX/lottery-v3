# lottery-v3# 年会抽奖系统详细文档

## 1. 系统概述

年会抽奖系统是一个基于Node.js和Vue.js的Web应用，用于公司年会等活动中进行抽奖。系统采用前后端分离架构，后端使用Express框架和Sequelize ORM，前端使用Vue 3框架。系统支持奖项管理、参与者管理、抽奖流程控制以及中奖记录管理等功能。

### 1.1 技术栈

**后端：**

- Node.js + Express.js：Web服务器框架
- Sequelize ORM：数据库对象关系映射
- SQLite：轻量级关系型数据库
- JWT：用户认证

**前端：**

- Vue 3：前端框架
- Element Plus：UI组件库
- Fetch API：网络请求

## 2. 系统架构

### 2.1 目录结构

```plaintext
lottery-v3/
├── lottery-backend/        # 后端代码
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── middlewares/    # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── app.js          # 应用入口
│   │   └── server.js       # 服务器启动
│   ├── database.sqlite     # SQLite数据库文件
│   └── package.json        # 后端依赖
└── src/                    # 前端代码
    ├── api/                # API调用
    ├── assets/             # 静态资源
    ├── components/         # 组件
    ├── router/             # 路由
    ├── views/              # 页面视图
    └── App.vue             # 根组件
```

### 2.2 系统流程图

```plaintext
+----------------+      +----------------+      +----------------+
|                |      |                |      |                |
|  参与者管理    | <--> |    抽奖系统    | <--> |   奖项管理     |
|                |      |                |      |                |
+----------------+      +----------------+      +----------------+
                               ^   |
                               |   v
                        +----------------+
                        |                |
                        |   中奖记录     |
                        |                |
                        +----------------+
```

## 3. 数据模型

### 3.1 Participant (参与者)

```javascript
const Participant = sequelize.define('Participant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  user_code: { type: DataTypes.STRING, unique: true },
  department: { type: DataTypes.STRING },
  weight: { type: DataTypes.FLOAT, defaultValue: 1.0 },
  has_won: { type: DataTypes.BOOLEAN, defaultValue: false },
  win_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  high_award_level: { type: DataTypes.INTEGER, defaultValue: 0 }
});
```

### 3.2 Award (奖项)

```javascript
const Award = sequelize.define('Award', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  count: { type: DataTypes.INTEGER, allowNull: false },
  remaining_count: { type: DataTypes.INTEGER, allowNull: false },
  level: { type: DataTypes.INTEGER, allowNull: false },
  draw_count: { type: DataTypes.INTEGER, defaultValue: 1 }
});
```

### 3.3 Winner (中奖记录)

```javascript
const Winner = sequelize.define('Winner', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  participant_id: { type: DataTypes.INTEGER, allowNull: false },
  award_id: { type: DataTypes.INTEGER, allowNull: false },
  epoch: { type: DataTypes.INTEGER, defaultValue: 0 },
  create_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

Winner.belongsTo(Participant, { foreignKey: 'participant_id' });
Winner.belongsTo(Award, { foreignKey: 'award_id' });
```

### 3.4 Epoch (抽奖轮次)

```javascript
const Epoch = sequelize.define('Epoch', {
  epoch_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  epoch: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('idle', 'running', 'paused', 'completed'),
    defaultValue: 'idle'
  }
});
```

## 4. API接口

### 4.1 管理员接口

| 接口               | 方法 | 描述       | 参数                   | 返回      |
| ------------------ | ---- | ---------- | ---------------------- | --------- |
| `/api/admin/login` | POST | 管理员登录 | `{username, password}` | `{token}` |

### 4.2 抽奖接口

| 接口                                | 方法 | 描述                 | 参数                             | 返回                        |
| ----------------------------------- | ---- | -------------------- | -------------------------------- | --------------------------- |
| `/api/lottery/start`                | POST | 开始抽奖             | 无                               | `{message}`                 |
| `/api/lottery/stop`                 | POST | 停止抽奖并产生结果   | `{awards_to_draw, participants}` | `{winners, updated_awards}` |
| `/api/lottery/reset`                | POST | 重置抽奖数据         | 无                               | `{message}`                 |
| `/api/lottery/winners/latest-round` | GET  | 获取最新一轮中奖记录 | 无                               | `{epoch, winners}`          |

### 4.3 奖项接口

| 接口              | 方法   | 描述         | 参数                                            | 返回        |
| ----------------- | ------ | ------------ | ----------------------------------------------- | ----------- |
| `/api/awards`     | GET    | 获取所有奖项 | 无                                              | `[{award}]` |
| `/api/awards/:id` | GET    | 获取单个奖项 | `id`                                            | `{award}`   |
| `/api/awards`     | POST   | 创建奖项     | `{name, description, count, level, draw_count}` | `{award}`   |
| `/api/awards/:id` | PUT    | 更新奖项     | `{name, description, count, level, draw_count}` | `{award}`   |
| `/api/awards/:id` | DELETE | 删除奖项     | `id`                                            | `{message}` |

### 4.4 参与者接口

| 接口                        | 方法 | 描述           | 参数             | 返回               |
| --------------------------- | ---- | -------------- | ---------------- | ------------------ |
| `/api/participants`         | GET  | 获取所有参与者 | 无               | `[{participant}]`  |
| `/api/participants/import`  | POST | 导入参与者     | `FormData(file)` | `{message, count}` |
| `/api/participants/lottery` | GET  | 获取抽奖名单   | 无               | `[{participant}]`  |

### 4.5 中奖记录接口

| 接口                  | 方法   | 描述         | 参数               | 返回                         |
| --------------------- | ------ | ------------ | ------------------ | ---------------------------- |
| `/api/winners`        | GET    | 获取中奖记录 | `?page=1&limit=10` | `{total, page, limit, data}` |
| `/api/winners/export` | GET    | 导出中奖记录 | 无                 | `Excel文件`                  |
| `/api/winners/:id`    | DELETE | 删除中奖记录 | `id`               | `{message}`                  |

## 5. 前后端交互流程

### 5.1 抽奖流程

1. **初始化**
   - 前端加载页面时，调用以下API获取初始数据：
     - `/api/awards` 获取奖项列表
     - `/api/participants/lottery` 获取抽奖名单
     - `/api/lottery/winners/latest-round` 获取最新中奖记录

2. **开始抽奖**
   - 用户选择奖项并点击"开始"按钮
   - 前端开始名单滚动动画
   - 前端调用 `/api/lottery/start` 通知后端抽奖开始

3. **停止抽奖**
   - 用户点击"停止"按钮
   - 前端调用 `/api/lottery/stop` 并传递当前奖项和参与者列表
   - 后端执行抽奖算法，返回中奖结果
   - 前端展示中奖者信息并更新奖项剩余数量

4. **重置抽奖**
   - 用户点击"重置抽奖数据"按钮
   - 前端弹出确认对话框
   - 用户确认后，前端调用 `/api/lottery/reset`
   - 后端重置所有中奖记录、参与者状态和奖项剩余数量
   - 前端重新加载所有数据

### 5.2 奖项管理流程

1. **查看奖项**
   - 前端调用 `/api/awards` 获取所有奖项
   - 前端展示奖项列表

2. **添加奖项**
   - 用户填写奖项信息并提交
   - 前端调用 `/api/awards` (POST) 创建奖项
   - 前端刷新奖项列表

3. **编辑奖项**
   - 用户修改奖项信息并提交
   - 前端调用 `/api/awards/:id` (PUT) 更新奖项
   - 前端刷新奖项列表

4. **删除奖项**
   - 用户点击删除按钮
   - 前端调用 `/api/awards/:id` (DELETE) 删除奖项
   - 前端刷新奖项列表

### 5.3 参与者管理流程

1. **查看参与者**
   - 前端调用 `/api/participants` 获取所有参与者
   - 前端展示参与者列表

2. **导入参与者**
   - 用户上传Excel文件
   - 前端调用 `/api/participants/import` 导入参与者
   - 前端刷新参与者列表

### 5.4 中奖记录管理流程

1. **查看中奖记录**
   - 前端调用 `/api/winners?page=1&limit=10` 获取中奖记录
   - 前端展示中奖记录列表

2. **导出中奖记录**
   - 用户点击导出按钮
   - 前端调用 `/api/winners/export` 下载Excel文件

## 6. 关键功能实现

### 6.1 抽奖算法

抽奖算法在 `lotteryController.js` 的 `stop` 方法中实现，主要步骤如下：

1. 接收前端传递的奖项和参与者列表
2. 根据奖项的 `draw_count` 和 `remaining_count` 确定实际抽取人数
3. 为每个参与者计算权重（考虑已中奖次数和奖项等级）
4. 使用加权随机算法选择中奖者
5. 记录中奖信息并更新参与者状态和奖项剩余数量
6. 返回中奖结果给前端

```javascript
// 抽奖权重计算
const weights = availableParticipants.map(p => {
  let weight = 1.0;
  weight /= (p.win_count + 1);
  weight /= (award.level * 0.2);
  return weight;
});

// 加权随机选择
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
```

### 6.2 数据重置功能

数据重置功能在 `lotteryController.js` 的 `reset` 方法中实现，使用事务确保原子性：

```javascript
reset: async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // 清除所有中奖记录
    await Winner.destroy({ where: {}, transaction });
    
    // 重置参与者状态
    await Participant.update(
      { has_won: false, win_count: 0, high_award_level: 0 },
      { where: {}, transaction }
    );
    
    // 恢复奖项初始数量
    await Award.update(
      { remaining_count: sequelize.col('count') },
      { where: {}, transaction }
    );
    
    // 重置抽奖轮次
    await Epoch.update(
      { epoch: 0, status: 'idle' },
      { where: {}, transaction }
    );
    
    await transaction.commit();
    res.json({ message: '重置成功' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: '服务器错误' });
  }
}
```

### 6.3 前端抽奖动画

前端抽奖动画在 `Home.vue` 中实现，使用 `setInterval` 实现名单滚动效果：

```javascript
// 开始抽奖
const startLottery = () => {
  if (isDrawing.value) return;
  
  // 初始化抽奖状态
  isDrawing.value = true;
  
  // 获取可用参与者列表
  const availableParticipantsList = availableParticipants.value.map(p => p.name);
  
  // 开始滚动动画
  let index = 0;
  rollingInterval.value = setInterval(() => {
    currentRollingName.value = availableParticipantsList[index];
    if (index === availableParticipantsList.length - 1) {
      index = 0;
    } else {
      index++;
    }
  }, rollingSpeed);
}
```

## 7. 安全性考虑

### 7.1 认证机制

系统使用JWT进行认证，但当前实现中认证中间件被注释掉了部分代码，导致所有请求都被放行：

```javascript
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // 不需要验证token，直接放行所有请求
    // if (!token) {
    //   return res.status(401).json({ message: '未提供认证令牌' });
    // }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const admin = await Admin.findByPk(decoded.id);
        if (admin) {
          req.admin = admin;
        }
      } catch (err) {
        // 忽略token验证错误
        console.log('Token验证失败，但仍然放行请求');
      }
    }
    
    // 无论是否有token或验证成功，都放行请求
    next();
  } catch (error) {
    console.error('中间件错误:', error);
    // 即使出错也放行请求
    next();
  }
};
```

**安全建议**：恢复认证中间件的完整功能，确保敏感操作需要有效的认证令牌。

### 7.2 数据验证

系统在处理用户输入时进行了一定的数据验证，但可以进一步加强：

```javascript
// 验证输入
if (!Array.isArray(participants) || participants.length === 0) {
  return res.status(400).json({ message: '参与者列表无效' });
}
if (!Array.isArray(awards_to_draw) || awards_to_draw.length === 0) {
  return res.status(400).json({ message: '奖项列表无效' });
}
```

**安全建议**：对所有用户输入进行更严格的验证，包括类型检查、范围检查和格式验证。

## 8. 性能优化

### 8.1 数据库事务

系统在关键操作中使用了数据库事务，确保数据一致性：

```javascript
const transaction = await sequelize.transaction();
try {
  // 数据库操作
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
}
```

### 8.2 前端优化

前端使用了本地存储来缓存中奖记录，减少不必要的API调用：

```javascript
// 保存到localStorage
localStorage.setItem('lottery_winners', JSON.stringify(winners.value));
```

## 9. 潜在问题和改进建议

### 9.1 认证问题

**问题**：当前认证中间件被修改为放行所有请求，存在安全风险。

**建议**：恢复完整的认证逻辑，确保敏感操作需要有效的认证令牌。

### 9.2 数据重置问题

**问题**：数据重置功能中存在一个额外的事务声明，可能导致问题：

```javascript
reset: async (req, res) => {
  const transaction = await sequelize.transaction(); // 这行是多余的
  console.log('进入reset函数');
  try {
    const transaction = await sequelize.transaction(); // 这才是实际使用的事务
    // ...
  }
}
```

**建议**：移除多余的事务声明，避免资源泄漏。

### 9.3 错误处理改进

**问题**：部分API错误处理不够详细，难以定位问题。

**建议**：增加更详细的错误日志和错误响应，帮助调试和问题定位。

```javascript
catch (error) {
  console.error('操作失败详细信息:', error);
  res.status(500).json({
    message: '服务器错误',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
```

### 9.4 前端数据验证

**问题**：前端在发送请求前缺乏足够的数据验证。

**建议**：增加前端数据验证，减少无效请求。

```javascript
if (!selectedAward || selectedAward.remaining_count <= 0) {
  ElMessage.warning('请选择有效的奖项');
  return;
}
```

## 10. 结论

年会抽奖系统是一个功能完整的Web应用，采用前后端分离架构，提供了奖项管理、参与者管理、抽奖流程控制和中奖记录管理等功能。系统整体设计合理，但在认证机制、错误处理和数据验证方面存在一些改进空间。通过实施建议的改进措施，可以进一步提高系统的安全性、可靠性和用户体验。
        