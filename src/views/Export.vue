<template>
  <div class="export-container">
    <el-container>
      <el-header>
        <h2>数据导出</h2>
      </el-header>

      <el-main>
        <el-card class="export-card">
          <template #header>
            <div class="card-header">
              <span>中奖名单导出</span>
              <div class="header-controls">
                <el-button type="primary" @click="exportToExcel">
                  <el-icon>
                    <Download />
                  </el-icon>
                  导出Excel
                </el-button>
              </div>
            </div>
          </template>

          <!-- 筛选条件 -->
          <div class="filter-section">
            <el-form :inline="true" :model="filterForm" class="filter-form">
              <el-form-item label="轮次">
                <el-select v-model="filterForm.round" clearable placeholder="选择轮次">
                  <el-option v-for="round in rounds" :key="round" :label="`第${round}轮`" :value="round" />
                </el-select>
              </el-form-item>
              <el-form-item label="奖项">
                <el-select v-model="filterForm.awardId" clearable placeholder="选择奖项">
                  <el-option v-for="award in awards" :key="award.id" :label="award.name" :value="award.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="部门">
                <el-input v-model="filterForm.department" clearable placeholder="输入部门名称" />
              </el-form-item>
              <el-form-item label="中奖时间">
                <el-date-picker v-model="filterForm.dateRange" type="daterange" range-separator="至"
                  start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleFilter">查询</el-button>
                <el-button @click="resetFilter">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 数据表格 -->
          <el-table v-loading="loading" :data="filteredWinners" style="width: 100%" border stripe
            :default-sort="{ prop: 'timestamp', order: 'descending' }">
            <el-table-column prop="round" label="轮次" sortable width="100">
              <template #default="{ row }">
                第{{ row.round }}轮
              </template>
            </el-table-column>
            <el-table-column prop="award_name" label="奖项名称" sortable width="150">
              <template #default="{ row }">
                <el-tag :type="getAwardTagType(row.award_level)">{{ row.award_name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="user_code" label="用户编号" width="120" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="department" label="部门" width="180" />
            <el-table-column prop="timestamp" label="中奖时间" sortable width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.timestamp) }}
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="totalItems"
              @size-change="handleSizeChange" @current-change="handleCurrentChange" />
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

// 状态变量
const loading = ref(false)
const winners = ref([])
const awards = ref([])
const rounds = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)

// 筛选表单
const filterForm = ref({
  round: '',
  awardId: '',
  department: '',
  dateRange: []
})

// 获取所有中奖记录
const loadWinners = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/winners?limit=10000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error('获取中奖记录失败')
    const result = await response.json()
    console.log("result:", result)
    // 处理数据格式，将嵌套结构转换为平铺结构
    const data = result.data || result
    console.log("data:", data)
    if (Array.isArray(data)) {
      winners.value = data.map(item => ({
        id: item.id,
        round: item.epoch,
        award_name: item.Award?.name || '',
        award_level: item.Award?.level || 1,
        award_id: item.award_id,
        user_code: item.Participant?.user_code || '',
        name: item.Participant?.name || '',
        department: item.Participant?.department || '',
        timestamp: item.create_time || item.createdAt
      }))
      // 提取所有轮次
      rounds.value = [...new Set(winners.value.map(w => w.round))].sort((a, b) => a - b)
      totalItems.value = winners.value.length
    } else {
      winners.value = []
      rounds.value = []
      totalItems.value = 0
    }
  } catch (error) {
    console.error('加载中奖记录失败:', error)
    ElMessage.error('加载中奖记录失败')
  } finally {
    loading.value = false
  }
}

// 获取奖项列表
const loadAwards = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/awards', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error('获取奖项列表失败')
    const data = await response.json()
    awards.value = data
  } catch (error) {
    console.error('加载奖项列表失败:', error)
    ElMessage.error('加载奖项列表失败')
  }
}

// 根据奖项等级获取标签类型
const getAwardTagType = (level) => {
  const types = ['danger', 'warning', 'success']
  return types[level - 1] || 'info'
}

// 格式化日期时间
const formatDateTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 过滤后的数据（不分页，用于计算总数）
const allFilteredWinners = computed(() => {
  let filtered = [...winners.value]

  // 应用筛选条件
  if (filterForm.value.round) {
    filtered = filtered.filter(w => w.round === filterForm.value.round)
  }
  if (filterForm.value.awardId) {
    filtered = filtered.filter(w => w.award_id === filterForm.value.awardId)
  }
  if (filterForm.value.department) {
    filtered = filtered.filter(w =>
      w.department.toLowerCase().includes(filterForm.value.department.toLowerCase())
    )
  }
  if (filterForm.value.dateRange?.length === 2) {
    const [start, end] = filterForm.value.dateRange
    filtered = filtered.filter(w => {
      const date = dayjs(w.timestamp).format('YYYY-MM-DD')
      return date >= start && date <= end
    })
  }

  // 更新总数
  totalItems.value = filtered.length
  return filtered
})

// 分页后的数据
const filteredWinners = computed(() => {
  const filtered = allFilteredWinners.value
  // 分页
  const startIndex = (currentPage.value - 1) * pageSize.value
  return filtered.slice(startIndex, startIndex + pageSize.value)
})

// 处理筛选
const handleFilter = () => {
  currentPage.value = 1
}

// 重置筛选
const resetFilter = () => {
  filterForm.value = {
    round: '',
    awardId: '',
    department: '',
    dateRange: []
  }
  currentPage.value = 1
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 导出Excel
const exportToExcel = () => {
  // 准备导出数据 - 使用所有过滤后的数据（不分页）
  const exportData = allFilteredWinners.value.map(winner => ({
    '轮次': `第${winner.round}轮`,
    '奖项名称': winner.award_name,
    '用户编号': winner.user_code,
    '姓名': winner.name,
    '部门': winner.department,
    '中奖时间': formatDateTime(winner.timestamp)
  }))

  // 创建工作簿
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)

  // 设置列宽
  const colWidths = [
    { wch: 10 }, // 轮次
    { wch: 15 }, // 奖项名称
    { wch: 12 }, // 用户编号
    { wch: 10 }, // 姓名
    { wch: 20 }, // 部门
    { wch: 20 }  // 中奖时间
  ]
  ws['!cols'] = colWidths

  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(wb, ws, '中奖名单')

  // 导出文件
  const fileName = `中奖名单_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`
  XLSX.writeFile(wb, fileName)

  ElMessage.success('导出成功')
}

// 初始化
onMounted(() => {
  loadWinners()
  loadAwards()
})
</script>

<style lang="scss" scoped>
.export-container {
  padding: 20px;

  .el-header {
    padding: 0 0 20px 0;

    h2 {
      margin: 0;
      color: #303133;
    }
  }

  .export-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .filter-section {
      margin-bottom: 20px;

      .filter-form {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>