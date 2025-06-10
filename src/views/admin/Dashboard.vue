<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <!-- 统计卡片 -->
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon participants-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-title">参与人数</div>
            <div class="stat-value">{{ stats.participantCount }}</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon awards-icon">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-title">奖项数量</div>
            <div class="stat-value">{{ stats.awardCount }}</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon winners-icon">
            <el-icon><GoldMedal /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-title">已中奖人数</div>
            <div class="stat-value">{{ stats.winnerCount }}</div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon rounds-icon">
            <el-icon><Stopwatch /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-title">抽奖轮次</div>
            <div class="stat-value">{{ stats.roundCount }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据分析图表区域 -->
    <el-row :gutter="20" class="dashboard-row">
      <!-- 中奖分布饼图 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>中奖分布比例</span>
              <el-button type="text" @click="loadWinnerDistribution">刷新</el-button>
            </div>
          </template>
          <div ref="winnerPieChart" style="height: 300px;"></div>
        </el-card>
      </el-col>

      <!-- 部门中奖统计 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>部门中奖统计</span>
              <el-button type="text" @click="loadDepartmentStats">刷新</el-button>
            </div>
          </template>
          <div ref="departmentChart" style="height: 300px;"></div>
        </el-card>
      </el-col>

      <!-- 奖项分布统计 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>奖项分布统计</span>
              <el-button type="text" @click="loadAwardStats">刷新</el-button>
            </div>
          </template>
          <div ref="awardChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 部门分布分析 -->
    <el-row :gutter="20" class="dashboard-row">
      <!-- 部门人员分布饼图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>部门人员分布</span>
              <el-button type="text" @click="loadDepartmentDistribution">刷新</el-button>
            </div>
          </template>
          <div ref="departmentDistributionChart" style="height: 350px;"></div>
        </el-card>
      </el-col>

      <!-- 部门中奖率饼图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>部门中奖率分布</span>
              <el-button type="text" @click="loadDepartmentWinRate">刷新</el-button>
            </div>
          </template>
          <div ref="departmentWinRateChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 中奖趋势分析 -->
    <el-row :gutter="20" class="dashboard-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>中奖趋势分析</span>
              <div>
                <el-radio-group v-model="trendType" @change="loadTrendData">
                  <el-radio-button label="daily">按日统计</el-radio-button>
                  <el-radio-button label="hourly">按小时统计</el-radio-button>
                  <el-radio-button label="round">按轮次统计</el-radio-button>
                </el-radio-group>
                <el-button type="text" @click="loadTrendData" style="margin-left: 10px;">刷新</el-button>
              </div>
            </div>
          </template>
          <div ref="trendChart" style="height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="dashboard-row">
      <!-- 快捷操作 -->
      <el-col :span="8">
        <el-card class="action-card">
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="resetLotteryData">
              <el-icon><Refresh /></el-icon>
              重置中奖数据
            </el-button>
            <el-button type="danger" @click="clearAllData">
              <el-icon><Delete /></el-icon>
              清空所有数据
            </el-button>
            <el-button type="success" @click="exportToExcel">
              <el-icon><Download /></el-icon>
              导出中奖名单
            </el-button>
            <el-button @click="openBackgroundSelector">
              <el-icon><Picture /></el-icon>
              选择背景图片
            </el-button>
            <el-button @click="openDateTimePicker">
              <el-icon><Timer /></el-icon>
              设置抽奖时间
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 最近中奖记录 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近中奖记录</span>
              <el-button type="text" @click="loadWinners">刷新</el-button>
            </div>
          </template>
          <el-table :data="recentWinners" style="width: 100%" v-loading="loading">
            <el-table-column prop="round" label="轮次" width="80">
              <template #default="{ row }">
                第{{ row.round }}轮
              </template>
            </el-table-column>
            <el-table-column prop="award_name" label="奖项" width="120">
              <template #default="{ row }">
                <el-tag :type="getAwardTagType(row.award_level)">{{ row.award_name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="user_code" label="编号" width="100" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="department" label="部门" />
            <el-table-column prop="timestamp" label="中奖时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.timestamp) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 背景选择对话框 -->
    <el-dialog v-model="backgroundDialogVisible" title="选择背景图片" width="500px">
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
    </el-dialog>

    <!-- 时间设置对话框 -->
    <el-dialog v-model="dateTimeDialogVisible" title="设置抽奖时间" width="400px">
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
          <el-button type="primary" @click="saveLotteryDateTime">保存</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Trophy,
  GoldMedal,
  Stopwatch,
  Refresh,
  Delete,
  Download,
  Picture,
  Timer
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'

// 统计数据
const stats = ref({
  participantCount: 0,
  awardCount: 0,
  winnerCount: 0,
  roundCount: 0
})

// 最近中奖记录
const recentWinners = ref([])
const loading = ref(false)

// 背景选择
const backgroundDialogVisible = ref(false)
const currentBackground = ref('')
const backgroundOptions = [
  { name: '背景1', url: '/src/assets/background.png' },
  { name: '背景2', url: '/src/assets/background-2.png' },
  { name: '背景3', url: '/src/assets/backgroud-3.png' },
  { name: '背景4', url: '/src/assets/background-4.png' },
  { name: '背景5', url: '/src/assets/background-5.png' }
]

// 时间设置
const dateTimeDialogVisible = ref(false)
const lotteryDateTime = ref(new Date())

// 图表相关
const winnerPieChart = ref(null)
const departmentChart = ref(null)
const awardChart = ref(null)
const trendChart = ref(null)
const departmentDistributionChart = ref(null)
const departmentWinRateChart = ref(null)
const trendType = ref('daily')

// 图表实例
let winnerPieChartInstance = null
let departmentChartInstance = null
let awardChartInstance = null
let trendChartInstance = null
let departmentDistributionChartInstance = null
let departmentWinRateChartInstance = null

// 初始化
onMounted(async () => {
  await loadDashboardData()
  await loadWinners()
  loadCurrentBackground()
  loadLotteryDateTime()
  
  // 初始化图表
  await nextTick()
  initCharts()
  loadAllChartData()
})

// 加载仪表盘数据
const loadDashboardData = async () => {
  try {
    const response = await fetch('/api/admin/dashboard')
    if (!response.ok) throw new Error('获取仪表盘数据失败')
    
    const data = await response.json()
    stats.value = data
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载仪表盘数据失败')
  }
}

// 加载中奖记录
const loadWinners = async () => {
  try {
    loading.value = true
    const response = await fetch('/api/winners?limit=10')
    if (!response.ok) throw new Error('获取中奖记录失败')
    
    const result = await response.json()
    // 处理数据格式，将嵌套结构转换为平铺结构
    const data = result.data || result
    recentWinners.value = data.map(item => ({
      round: item.epoch,
      award_name: item.Award?.name || '',
      award_level: item.Award?.level || 1,
      user_code: item.Participant?.user_code || '',
      name: item.Participant?.name || '',
      department: item.Participant?.department || '',
      timestamp: item.create_time || item.createdAt
    }))
  } catch (error) {
    console.error('加载中奖记录失败:', error)
    ElMessage.error('加载中奖记录失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期时间
const formatDateTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 获取奖项标签类型
const getAwardTagType = (level) => {
  const types = ['danger', 'warning', 'success', 'info', '']
  return types[level - 1] || ''
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
    
    // 重新加载数据
    await loadDashboardData()
    await loadWinners()
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
    
    // 重新加载数据
    await loadDashboardData()
    await loadWinners()
  } catch (error) {
    if (error === 'cancel') return
    console.error('清空数据失败:', error)
    ElMessage.error('清空失败，请稍后重试')
  }
}

// 导出中奖名单
const exportToExcel = async () => {
  try {
    const response = await fetch('/api/winners/export')
    if (!response.ok) throw new Error('获取中奖记录失败')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `中奖名单_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`

    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

// 打开背景选择器
const openBackgroundSelector = () => {
  backgroundDialogVisible.value = true
}

// 选择背景
const selectBackground = (url) => {
  currentBackground.value = url
  localStorage.setItem('background', url)
  ElMessage.success('背景已更新')
  backgroundDialogVisible.value = false
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

// 打开日期时间选择器
const openDateTimePicker = () => {
  dateTimeDialogVisible.value = true
}

// 保存抽奖时间
const saveLotteryDateTime = () => {
  localStorage.setItem('lotteryDateTime', lotteryDateTime.value.getTime())
  ElMessage.success('抽奖时间已设置')
  dateTimeDialogVisible.value = false
}

// 加载抽奖时间
const loadLotteryDateTime = () => {
  const savedDateTime = localStorage.getItem('lotteryDateTime')
  if (savedDateTime) {
    lotteryDateTime.value = new Date(parseInt(savedDateTime))
  }
}

// 初始化图表
const initCharts = () => {
  if (winnerPieChart.value) {
    winnerPieChartInstance = echarts.init(winnerPieChart.value)
  }
  if (departmentChart.value) {
    departmentChartInstance = echarts.init(departmentChart.value)
  }
  if (awardChart.value) {
    awardChartInstance = echarts.init(awardChart.value)
  }
  if (trendChart.value) {
    trendChartInstance = echarts.init(trendChart.value)
  }
  if (departmentDistributionChart.value) {
    departmentDistributionChartInstance = echarts.init(departmentDistributionChart.value)
  }
  if (departmentWinRateChart.value) {
    departmentWinRateChartInstance = echarts.init(departmentWinRateChart.value)
  }
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    winnerPieChartInstance?.resize()
    departmentChartInstance?.resize()
    awardChartInstance?.resize()
    trendChartInstance?.resize()
    departmentDistributionChartInstance?.resize()
    departmentWinRateChartInstance?.resize()
  })
}

// 加载所有图表数据
const loadAllChartData = () => {
  loadWinnerDistribution()
  loadDepartmentStats()
  loadAwardStats()
  loadTrendData()
  loadDepartmentDistribution()
  loadDepartmentWinRate()
}

// 加载中奖分布数据
const loadWinnerDistribution = async () => {
  try {
    const response = await fetch('/api/winners/distribution')
    if (!response.ok) {
      // 如果API不存在，使用模拟数据
      const mockData = [
        { name: '已中奖', value: stats.value.winnerCount, itemStyle: { color: '#67c23a' } },
        { name: '未中奖', value: stats.value.participantCount - stats.value.winnerCount, itemStyle: { color: '#e6a23c' } }
      ]
      renderWinnerPieChart(mockData)
      return
    }
    
    const data = await response.json()
    renderWinnerPieChart(data)
  } catch (error) {
    console.error('加载中奖分布数据失败:', error)
    // 使用模拟数据
    const mockData = [
      { name: '已中奖', value: stats.value.winnerCount, itemStyle: { color: '#67c23a' } },
      { name: '未中奖', value: stats.value.participantCount - stats.value.winnerCount, itemStyle: { color: '#e6a23c' } }
    ]
    renderWinnerPieChart(mockData)
  }
}

// 渲染中奖分布饼图
const renderWinnerPieChart = (data) => {
  if (!winnerPieChartInstance) return
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '中奖分布',
        type: 'pie',
        radius: '50%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  winnerPieChartInstance.setOption(option)
}

// 加载部门统计数据
const loadDepartmentStats = async () => {
  try {
    const response = await fetch('/api/winners/department-stats')
    if (!response.ok) {
      // 使用模拟数据
      const mockData = {
        departments: ['技术部', '市场部', '人事部', '财务部', '运营部'],
        winnerCounts: [15, 12, 8, 6, 10],
        totalCounts: [25, 20, 15, 12, 18]
      }
      renderDepartmentChart(mockData)
      return
    }
    
    const data = await response.json()
    renderDepartmentChart(data)
  } catch (error) {
    console.error('加载部门统计数据失败:', error)
    // 使用模拟数据
    const mockData = {
      departments: ['技术部', '市场部', '人事部', '财务部', '运营部'],
      winnerCounts: [15, 12, 8, 6, 10],
      totalCounts: [25, 20, 15, 12, 18]
    }
    renderDepartmentChart(mockData)
  }
}

// 渲染部门统计图表
const renderDepartmentChart = (data) => {
  if (!departmentChartInstance) return
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['中奖人数', '总人数']
    },
    xAxis: {
      type: 'category',
      data: data.departments
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '中奖人数',
        type: 'bar',
        data: data.winnerCounts,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '总人数',
        type: 'bar',
        data: data.totalCounts,
        itemStyle: { color: '#409eff' }
      }
    ]
  }
  
  departmentChartInstance.setOption(option)
}

// 加载奖项统计数据
const loadAwardStats = async () => {
  try {
    const response = await fetch('/api/awards/stats')
    if (!response.ok) {
      // 使用模拟数据
      const mockData = [
        { name: '一等奖', value: 2, total: 3, itemStyle: { color: '#f56c6c' } },
        { name: '二等奖', value: 8, total: 10, itemStyle: { color: '#e6a23c' } },
        { name: '三等奖', value: 25, total: 30, itemStyle: { color: '#67c23a' } },
        { name: '参与奖', value: 16, total: 20, itemStyle: { color: '#909399' } }
      ]
      renderAwardChart(mockData)
      return
    }
    
    const data = await response.json()
    renderAwardChart(data)
  } catch (error) {
    console.error('加载奖项统计数据失败:', error)
    // 使用模拟数据
    const mockData = [
      { name: '一等奖', value: 2, total: 3, itemStyle: { color: '#f56c6c' } },
      { name: '二等奖', value: 8, total: 10, itemStyle: { color: '#e6a23c' } },
      { name: '三等奖', value: 25, total: 30, itemStyle: { color: '#67c23a' } },
      { name: '参与奖', value: 16, total: 20, itemStyle: { color: '#909399' } }
    ]
    renderAwardChart(mockData)
  }
}

// 渲染奖项统计图表
const renderAwardChart = (data) => {
  if (!awardChartInstance) return
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        let result = params[0].name + '<br/>'
        params.forEach(param => {
          const dataIndex = param.dataIndex
          const total = data[dataIndex].total
          const percentage = ((param.value / total) * 100).toFixed(1)
          result += param.seriesName + ': ' + param.value + '/' + total + ' (' + percentage + '%)<br/>'
        })
        return result
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '已抽取',
        type: 'bar',
        data: data.map(item => ({
          value: item.value,
          itemStyle: item.itemStyle
        }))
      }
    ]
  }
  
  awardChartInstance.setOption(option)
}

// 加载趋势数据
const loadTrendData = async () => {
  try {
    const response = await fetch(`/api/winners/trend?type=${trendType.value}`)
    if (!response.ok) {
      // 使用模拟数据
      const mockData = generateMockTrendData()
      renderTrendChart(mockData)
      return
    }
    
    const data = await response.json()
    renderTrendChart(data)
  } catch (error) {
    console.error('加载趋势数据失败:', error)
    // 使用模拟数据
    const mockData = generateMockTrendData()
    renderTrendChart(mockData)
  }
}

// 生成模拟趋势数据
const generateMockTrendData = () => {
  const now = new Date()
  const data = []
  
  if (trendType.value === 'daily') {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      data.push({
        time: dayjs(date).format('MM-DD'),
        count: Math.floor(Math.random() * 20) + 5
      })
    }
  } else if (trendType.value === 'hourly') {
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000).getHours()
      data.push({
        time: `${hour}:00`,
        count: Math.floor(Math.random() * 10) + 1
      })
    }
  } else if (trendType.value === 'round') {
    for (let i = 1; i <= 10; i++) {
      data.push({
        time: `第${i}轮`,
        count: Math.floor(Math.random() * 15) + 3
      })
    }
  }
  
  return data
}

// 渲染趋势图表
const renderTrendChart = (data) => {
  if (!trendChartInstance) return
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.time)
    },
    yAxis: {
      type: 'value',
      name: '中奖人数'
    },
    series: [
      {
        name: '中奖人数',
        type: 'line',
        data: data.map(item => item.count),
        smooth: true,
        itemStyle: { color: '#409eff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        }
      }
    ]
  }
  
  trendChartInstance.setOption(option)
}

// 加载部门人员分布数据
const loadDepartmentDistribution = async () => {
  try {
    const response = await fetch('/api/participants/department-distribution')
    if (!response.ok) {
      // 使用模拟数据
      const mockData = [
        { name: '技术部', value: 25, itemStyle: { color: '#409eff' } },
        { name: '市场部', value: 20, itemStyle: { color: '#67c23a' } },
        { name: '人事部', value: 15, itemStyle: { color: '#e6a23c' } },
        { name: '财务部', value: 12, itemStyle: { color: '#f56c6c' } },
        { name: '运营部', value: 18, itemStyle: { color: '#909399' } }
      ]
      renderDepartmentDistributionChart(mockData)
      return
    }
    
    const data = await response.json()
    renderDepartmentDistributionChart(data)
  } catch (error) {
    console.error('加载部门人员分布数据失败:', error)
    // 使用模拟数据
    const mockData = [
      { name: '技术部', value: 25, itemStyle: { color: '#409eff' } },
      { name: '市场部', value: 20, itemStyle: { color: '#67c23a' } },
      { name: '人事部', value: 15, itemStyle: { color: '#e6a23c' } },
      { name: '财务部', value: 12, itemStyle: { color: '#f56c6c' } },
      { name: '运营部', value: 18, itemStyle: { color: '#909399' } }
    ]
    renderDepartmentDistributionChart(mockData)
  }
}

// 渲染部门人员分布饼图
const renderDepartmentDistributionChart = (data) => {
  if (!departmentDistributionChartInstance) return
  
  const option = {
    title: {
      text: '总人数: ' + data.reduce((sum, item) => sum + item.value, 0),
      left: 'center',
      top: '5%',
      textStyle: {
        fontSize: 14,
        color: '#666'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}人 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        name: '部门人员分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: '{b}\n{c}人'
        }
      }
    ]
  }
  
  departmentDistributionChartInstance.setOption(option)
}

// 加载部门中奖率数据
const loadDepartmentWinRate = async () => {
  try {
    const response = await fetch('/api/winners/department-win-rate')
    if (!response.ok) {
      // 使用模拟数据
      const mockData = [
        { name: '技术部', value: 60.0, total: 25, winners: 15, itemStyle: { color: '#67c23a' } },
        { name: '市场部', value: 60.0, total: 20, winners: 12, itemStyle: { color: '#409eff' } },
        { name: '人事部', value: 53.3, total: 15, winners: 8, itemStyle: { color: '#e6a23c' } },
        { name: '财务部', value: 50.0, total: 12, winners: 6, itemStyle: { color: '#f56c6c' } },
        { name: '运营部', value: 55.6, total: 18, winners: 10, itemStyle: { color: '#909399' } }
      ]
      renderDepartmentWinRateChart(mockData)
      return
    }
    
    const data = await response.json()
    renderDepartmentWinRateChart(data)
  } catch (error) {
    console.error('加载部门中奖率数据失败:', error)
    // 使用模拟数据
    const mockData = [
      { name: '技术部', value: 60.0, total: 25, winners: 15, itemStyle: { color: '#67c23a' } },
      { name: '市场部', value: 60.0, total: 20, winners: 12, itemStyle: { color: '#409eff' } },
      { name: '人事部', value: 53.3, total: 15, winners: 8, itemStyle: { color: '#e6a23c' } },
      { name: '财务部', value: 50.0, total: 12, winners: 6, itemStyle: { color: '#f56c6c' } },
      { name: '运营部', value: 55.6, total: 18, winners: 10, itemStyle: { color: '#909399' } }
    ]
    renderDepartmentWinRateChart(mockData)
  }
}

// 渲染部门中奖率饼图
const renderDepartmentWinRateChart = (data) => {
  if (!departmentWinRateChartInstance) return
  
  const option = {
    title: {
      text: '平均中奖率: ' + (data.reduce((sum, item) => sum + item.value, 0) / data.length).toFixed(1) + '%',
      left: 'center',
      top: '5%',
      textStyle: {
        fontSize: 14,
        color: '#666'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params) {
        const item = data[params.dataIndex]
        return `${params.seriesName}<br/>${params.name}<br/>中奖率: ${params.value}%<br/>中奖人数: ${item.winners}/${item.total}`
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [
      {
        name: '部门中奖率',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: true,
          formatter: function(params) {
            const item = data[params.dataIndex]
            return `${params.name}\n${params.value}%\n(${item.winners}/${item.total})`
          }
        }
      }
    ]
  }
  
  departmentWinRateChartInstance.setOption(option)
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  .dashboard-row {
    margin-top: 20px;
  }
  
  .stat-card {
    height: 120px;
    display: flex;
    align-items: center;
    
    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      
      .el-icon {
        font-size: 30px;
        color: white;
      }
    }
    
    .participants-icon {
      background-color: #409eff;
    }
    
    .awards-icon {
      background-color: #67c23a;
    }
    
    .winners-icon {
      background-color: #e6a23c;
    }
    
    .rounds-icon {
      background-color: #f56c6c;
    }
    
    .stat-info {
      .stat-title {
        font-size: 14px;
        color: #909399;
        margin-bottom: 5px;
      }
      
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
      }
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .background-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    
    .background-option {
      width: 120px;
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
        height: 80px;
        object-fit: cover;
      }
      
      .bg-name {
        padding: 5px;
        text-align: center;
        font-size: 12px;
      }
    }
  }
}
</style>