<template>
  <div class="award-management">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>奖项管理</span>
          <el-button type="primary" @click="handleAdd">添加奖项</el-button>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="awardList"
        style="width: 100%"
        border
      >
        <el-table-column prop="name" label="奖项名称" width="180" />
        <el-table-column prop="description" label="奖项描述" />
        <el-table-column label="总数量" width="100">
          <template #default="{ row }">
            {{ row.count }}
          </template>
        </el-table-column>
        <el-table-column prop="remaining_count" label="剩余数量" width="100" />
        <el-table-column prop="level" label="奖项等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)">
              {{ getLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="draw_count" label="一次抽取人数" width="120" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑奖项对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="奖项名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入奖项名称" />
        </el-form-item>
        <el-form-item label="奖项描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入奖项描述"
          />
        </el-form-item>
        <el-form-item label="奖项数量" prop="count">
          <el-input-number
            v-model="form.count"
            :min="1"
            :max="1000"
            placeholder="请输入奖项数量"
          />
        </el-form-item>
        <el-form-item label="奖项等级" prop="level">
          <el-select v-model="form.level" placeholder="请选择奖项等级">
            <el-option
              v-for="item in levelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="一次抽取人数" prop="draw_count">
          <el-input-number
            v-model="form.draw_count"
            :min="1"
            :max="20"
            placeholder="请输入一次抽取人数"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAwardList, addAward, updateAward, deleteAward } from '@/api/award'

const loading = ref(false)
const awardList = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const form = ref({
  name: '',
  description: '',
  count: 1,
  level: 1,
  draw_count: 1 // 一次抽取人数
})

const levelOptions = [
  { value: 1, label: '特等奖' },
  { value: 2, label: '一等奖' },
  { value: 3, label: '二等奖' },
  { value: 4, label: '三等奖' },
  { value: 5, label: '四等奖' }
]

const rules = {
  name: [
    { required: true, message: '请输入奖项名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入奖项描述', trigger: 'blur' }
  ],
  count: [
    { required: true, message: '请输入奖项数量', trigger: 'blur' }
  ],
  level: [
    { required: true, message: '请选择奖项等级', trigger: 'change' }
  ],
  draw_count: [
    { required: true, message: '请输入一次抽取人数', trigger: 'blur' }
  ]
}

// 获取奖项列表
const fetchAwardList = async () => {
  loading.value = true
  try {
    console.log('开始获取奖项列表...')
    
    // 尝试直接访问后端API
    console.log('尝试使用fetch API直接访问')
    try {
      // 可以在控制台直接执行这段代码进行测试
      console.log(`
// 复制以下代码到浏览器控制台执行，测试API
fetch('/api/awards')
  .then(response => {
    console.log('响应状态:', response.status)
    return response.json()
  })
  .then(data => {
    console.log('API响应数据:', data)
  })
  .catch(error => {
    console.error('API请求失败:', error)
  })
      `)
      
      const response = await fetch('/api/awards')
      console.log('fetch响应状态:', response.status)
      const data = await response.json()
      console.log('fetch API响应数据:', data)
      
      if (Array.isArray(data) && data.length > 0) {
        awardList.value = data
        return
      }
    } catch (fetchError) {
      console.error('fetch API请求失败:', fetchError)
    }
    
    // 方法1：使用API模块
    const res = await getAwardList()
    console.log('获取奖项列表响应:', res)
    
    // 方法2：直接使用axios检查
    const axios = (await import('axios')).default
    const directRes = await axios.get('/api/awards')
    console.log('直接请求后端API响应:', directRes)
    
    if (Array.isArray(res)) {
      awardList.value = res
      console.log('奖项列表数据设置成功:', awardList.value)
    } else if (res && res.data && Array.isArray(res.data)) {
      awardList.value = res.data
      console.log('从res.data获取奖项列表成功:', awardList.value)
    } else if (directRes && directRes.data && Array.isArray(directRes.data)) {
      // 如果直接请求成功但API模块失败，使用直接请求的结果
      awardList.value = directRes.data
      console.log('从直接请求获取奖项列表成功:', awardList.value)
    } else {
      console.warn('奖项列表格式不符合预期:', res)
      awardList.value = []
    }
  } catch (error) {
    console.error('获取奖项列表失败:', error)
    try {
      // 尝试直接请求作为备选
      const axios = (await import('axios')).default
      const fallbackRes = await axios.get('/api/awards')
      console.log('备选请求后端API响应:', fallbackRes)
      if (fallbackRes && fallbackRes.data) {
        awardList.value = fallbackRes.data
        console.log('通过备选请求获取奖项列表成功')
      } else {
        ElMessage.error('获取奖项列表失败')
      }
    } catch (fallbackError) {
      console.error('备选请求也失败:', fallbackError)
      ElMessage.error('获取奖项列表失败')
    }
  } finally {
    loading.value = false
  }
}

// 添加奖项
const handleAdd = () => {
  dialogTitle.value = '添加奖项'
  form.value = {
    name: '',
    description: '',
    count: 1,
    level: 1,
    draw_count: 1
  }
  dialogVisible.value = true
}

// 编辑奖项
const handleEdit = (row) => {
  dialogTitle.value = '编辑奖项'
  form.value = { ...row }
  dialogVisible.value = true
}

// 删除奖项
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该奖项吗？', '提示', {
      type: 'warning'
    })
    await deleteAward(row.id)
    ElMessage.success('删除成功')
    fetchAwardList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    if (form.value.id) {
      await updateAward(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await addAward(form.value)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchAwardList()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 获取奖项等级类型
const getLevelType = (level) => {
  const types = ['', 'danger', 'warning', 'success', 'info', 'primary']
  return types[level] || 'primary'
}

// 获取奖项等级文本
const getLevelText = (level) => {
  const texts = ['', '特等奖', '一等奖', '二等奖', '三等奖', '四等奖']
  return texts[level] || '未知'
}

onMounted(() => {
  fetchAwardList()
})
</script>

<style lang="scss" scoped>
.award-management {
  padding: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .el-table {
    margin-top: 20px;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style>