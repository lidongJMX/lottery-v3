<template>
  <div class="participants-container">
    <el-container>
      <el-header>
        <h2>人员管理</h2>
        <div class="header-actions">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".xlsx,.xls"
          >
            <template #trigger>
              <el-button type="primary">导入Excel</el-button>
            </template>
          </el-upload>
          <el-button type="success" @click="exportTemplate">
            下载模板
          </el-button>
        </div>
      </el-header>

      <el-main>
        <el-table :data="pagedParticipants" style="width: 100%">
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="user_code" label="用户编码" />
          <el-table-column prop="department" label="部门" />
          <el-table-column prop="weight" label="中奖权重">
            <template #default="{ row }">
              <el-input-number
                v-model="row.weight"
                :min="1"
                :max="10"
                size="small"
                @change="updateWeight(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="isWinner" label="是否中奖">
            <template #default="{ row }">
              <el-tag :type="row.isWinner ? 'success' : 'info'">
                {{ row.isWinner ? '已中奖' : '未中奖' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="winCount" label="中奖次数" />
          <el-table-column prop="highestLevel" label="最高奖级别">
            <template #default="{ row }">
              <el-tag v-if="row.highestLevel" :type="getLevelTagType(row.highestLevel)">
                {{ getLevelText(row.highestLevel) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button
                type="danger"
                size="small"
                @click="deleteParticipant(row)"
                :disabled="row.isWinner"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="participants.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="pagination"
        />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed, onMounted, ref} from 'vue'
import { useParticipantStore } from '@/stores/participant'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import { pa } from 'element-plus/es/locales.mjs'

const participantStore = useParticipantStore()
const participants = computed(() => participantStore.participants)
const isLoading = ref(false) // 添加加载状态

onMounted(async () => {
  try {
    isLoading.value = true
    await participantStore.fetchParticipants()
    console.log('Participants loaded:', participants.value) // 调试输出
    // 更好的调试方式
  } catch (error) {
    ElMessage.error('加载参与者列表失败: ' + error.message)
  } finally {
    isLoading.value = false
  }
})
// 添加分页相关状态
const currentPage = ref(1)
const pageSize = ref(10)

// 添加分页计算属性
const pagedParticipants = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  console.log('分页',participants.value)
  return participants.value.slice(start, end)
})

// 分页变化处理函数
const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}
const getLevelTagType = (level) => {
  const types = {
    1: 'danger',
    2: 'warning',
    3: 'success',
    4: 'info',
    5: ''
  }
  return types[level] || ''
}

const getLevelText = (level) => {
  const texts = {
    1: '特等奖',
    2: '一等奖',
    3: '二等奖',
    4: '三等奖',
    5: '四等奖'
  }
  return texts[level] || ''
}

const handleFileChange = async (file) => {
  try {
    const data = await readExcelFile(file.raw)
    
    // 跳过表头行
    const dataWithoutHeader = data.slice(1)
    
    if (dataWithoutHeader.length === 0) {
      ElMessage.error('Excel文件中没有数据行')
      return
    }
    
    // 验证数据
    const errors = []
    dataWithoutHeader.forEach((row, index) => {
      const rowNumber = index + 2 // 加2是因为Excel从1开始计数，且跳过了表头行
      if (!row.name) errors.push(`第${rowNumber}行：姓名为必填项`)
      if (!row.user_code) errors.push(`第${rowNumber}行：用户编码为必填项`)
      if (!row.department) errors.push(`第${rowNumber}行：部门为必填项`)
      if (row.weight && (isNaN(row.weight) || row.weight < 1 || row.weight > 10)) {
        errors.push(`第${rowNumber}行：中奖权重必须是1-10之间的数字`)
      }
    })
    
    if (errors.length > 0) {
      ElMessage.error(errors.join('\n'))
      return
    }
    
    participantStore.importParticipants(data)
    ElMessage.success('导入成功')
  } catch (error) {
    ElMessage.error('导入失败：' + error.message)
  }
}

const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target.result
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        
        // 设置表头映射关系
        const headerMap = {
          '姓名': 'name',
          '用户编码': 'user_code',
          '部门': 'department'
        }
        
        // 获取原始数据，包含表头
        const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        if (rawData.length === 0) {
          reject(new Error('Excel文件为空'))
          return
        }
        
        // 验证表头
        const headers = rawData[0]
        const missingHeaders = Object.keys(headerMap).filter(required => 
          !headers.some(header => header && header.trim() === required)
        )
        
        if (missingHeaders.length > 0) {
          reject(new Error(`Excel文件格式错误，缺少必要的表头：${missingHeaders.join('、')}`))
          return
        }
        
        // 转换数据，使用表头映射
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          header: headers,
          defval: null
        })
        
        // 移除表头行
        jsonData.shift()
        
        // 处理数据，确保字段名称正确
        const processedData = jsonData.map(row => ({
          name: row['姓名'],
          user_code: row['用户编码'],
          department: row['部门'],
          weight: row['中奖权重'] ? Number(row['中奖权重']) : 1
        }))
        
        resolve(processedData)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

const exportTemplate = () => {
  const template = [
    {
      name: '姓名（必填）',
      user_code: '用户编码（必填）',
      department: '部门（必填）',
      weight: '中奖权重（选填，默认为1）'
    }
  ]
  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '模板')
  XLSX.writeFile(wb, '抽奖人员模板.xlsx')
}

const updateWeight = (participant) => {
  participantStore.updateParticipant(participant)
}

const deleteParticipant = async (participant) => {
  try {
    await ElMessageBox.confirm('确定要删除这个参与人员吗？', '提示', {
      type: 'warning'
    })
    participantStore.deleteParticipant(participant.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消删除
  }
}

</script>

<style lang="scss" scoped>
.participants-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff4d4d 0%, #ff8c8c 100%);
  color: white;
  padding: 20px;

  .el-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .el-main {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 10px;
    padding: 20px;
    position: relative;
    padding-bottom: 80px; // 为分页预留空间
  }
  .pagination {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9);
    padding: 10px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    z-index: 100;
  }
  :deep(.el-table) {
    background: transparent;
    
    th {
      background-color: var(--primary-color);
      color: white;
    }
    
    td {
      background-color: white;
    }
  }
}
</style>