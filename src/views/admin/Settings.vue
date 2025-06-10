<template>
  <div class="settings-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- 背景设置 -->
        <el-tab-pane label="背景设置" name="background">
          <div class="settings-section">
            <h3>背景图片设置</h3>
            <p class="section-desc">选择抽奖页面的背景图片</p>
            
            <div class="background-selector">
              <div
                v-for="(bg, index) in backgroundOptions"
                :key="index"
                class="background-option"
                :class="{ active: currentBackground === bg.url }"
                @click="selectBackground(bg.url)"
              >
                <img :src="bg.url" :alt="bg.name" />
                <div class="bg-name">{{ bg.name }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 时间设置 -->
        <el-tab-pane label="时间设置" name="time">
          <div class="settings-section">
            <h3>抽奖时间设置</h3>
            <p class="section-desc">设置抽奖开始时间，用于首页倒计时显示</p>
            
            <el-form>
              <el-form-item label="抽奖开始时间">
                <el-date-picker
                  v-model="lotteryDateTime"
                  type="datetime"
                  placeholder="选择日期时间"
                  format="YYYY-MM-DD HH:mm:ss"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveLotteryDateTime">保存时间设置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 数据管理 -->
        <el-tab-pane label="数据管理" name="data">
          <div class="settings-section">
            <h3>数据重置与清空</h3>
            <p class="section-desc">管理抽奖系统的数据，包括重置中奖数据和清空所有数据</p>
            
            <div class="data-actions">
              <el-card class="action-card">
                <template #header>
                  <div class="action-header">
                    <span>重置中奖数据</span>
                  </div>
                </template>
                <div class="action-content">
                  <p>此操作将清空所有中奖记录，恢复所有参与者状态，并重置奖项剩余数量。</p>
                  <el-button type="warning" @click="resetLotteryData">重置中奖数据</el-button>
                </div>
              </el-card>
              
              <el-card class="action-card">
                <template #header>
                  <div class="action-header">
                    <span>清空所有数据</span>
                  </div>
                </template>
                <div class="action-content">
                  <p>此操作将清空所有参与者列表、中奖记录，并重置奖项和轮次数据。此操作不可恢复！</p>
                  <el-button type="danger" @click="clearAllData">清空所有数据</el-button>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 系统信息 -->
        <el-tab-pane label="系统信息" name="info">
          <div class="settings-section">
            <h3>系统信息</h3>
            <p class="section-desc">查看系统版本和相关信息</p>
            
            <el-descriptions :column="1" border>
              <el-descriptions-item label="系统名称">年会抽奖系统</el-descriptions-item>
              <el-descriptions-item label="系统版本">v3.0.0</el-descriptions-item>
              <el-descriptions-item label="前端框架">Vue 3 + Vite + Element Plus</el-descriptions-item>
              <el-descriptions-item label="后端框架">Express + MongoDB</el-descriptions-item>
              <el-descriptions-item label="开发者">抽奖系统开发团队</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 当前激活的标签页
const activeTab = ref('background')

// 背景设置
const currentBackground = ref('')
const backgroundOptions = [
  { name: '背景1', url: '/src/assets/background.png' },
  { name: '背景2', url: '/src/assets/background-2.png' },
  { name: '背景3', url: '/src/assets/backgroud-3.png' },
  { name: '背景4', url: '/src/assets/background-4.png' },
  { name: '背景5', url: '/src/assets/background-5.png' }
]

// 时间设置
const lotteryDateTime = ref(new Date())

// 初始化
onMounted(() => {
  loadCurrentBackground()
  loadLotteryDateTime()
})

// 选择背景
const selectBackground = (url) => {
  currentBackground.value = url
  localStorage.setItem('background', url)
  ElMessage.success('背景已更新')
}

// 加载当前背景
const loadCurrentBackground = () => {
  const savedBackground = localStorage.getItem('background')
  if (savedBackground) {
    currentBackground.value = savedBackground
  } else {
    // 默认背景
    currentBackground.value = backgroundOptions[0].url
  }
}

// 保存抽奖时间
const saveLotteryDateTime = () => {
  localStorage.setItem('lotteryDateTime', lotteryDateTime.value.getTime())
  ElMessage.success('抽奖时间已设置')
}

// 加载抽奖时间
const loadLotteryDateTime = () => {
  const savedDateTime = localStorage.getItem('lotteryDateTime')
  if (savedDateTime) {
    lotteryDateTime.value = new Date(parseInt(savedDateTime))
  }
}

// 重置抽奖数据
const resetLotteryData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有中奖数据吗？此操作将清空所有中奖记录，恢复所有参与者状态，并重置奖项剩余数量。',
      '重置确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const response = await fetch('/api/lottery/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) throw new Error('重置失败')

    const result = await response.json()
    ElMessage.success(result.message || '重置成功')
  } catch (error) {
    if (error === 'cancel') return
    console.error('重置抽奖数据失败:', error)
    ElMessage.error('重置失败，请稍后重试')
  }
}

// 清空所有数据
const clearAllData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有数据吗？此操作将清空所有参与者列表、中奖记录，并重置奖项和轮次数据。此操作不可恢复！',
      '清空确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger',
      }
    )

    const response = await fetch('/api/lottery/clearAllData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) throw new Error('清空失败')

    const result = await response.json()
    ElMessage.success('所有数据已清空')
  } catch (error) {
    if (error === 'cancel') return
    console.error('清空数据失败:', error)
    ElMessage.error('清空失败，请稍后重试')
  }
}
</script>

<style lang="scss" scoped>
.settings-container {
  .settings-section {
    margin-bottom: 30px;
    
    h3 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 18px;
      font-weight: 600;
    }
    
    .section-desc {
      color: #909399;
      margin-bottom: 20px;
    }
  }
  
  .background-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    
    .background-option {
      width: 150px;
      cursor: pointer;
      border: 2px solid transparent;
      border-radius: 4px;
      overflow: hidden;
      transition: all 0.3s;
      
      &.active {
        border-color: #409eff;
      }
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      }
      
      img {
        width: 100%;
        height: 100px;
        object-fit: cover;
      }
      
      .bg-name {
        padding: 8px;
        text-align: center;
        font-size: 14px;
      }
    }
  }
  
  .data-actions {
    display: flex;
    gap: 20px;
    
    .action-card {
      flex: 1;
      
      .action-header {
        font-weight: bold;
      }
      
      .action-content {
        p {
          margin-bottom: 15px;
          color: #606266;
        }
      }
    }
  }
}
</style>