<template>
  <ElButton type="primary" class="next-epoch" @click="nextEpoch">
    下一轮
  </ElButton>
</template>
<script setup>
import { ElButton, ElMessage } from 'element-plus'

const nextEpoch = async () => {
  try {
    const response = await fetch('/api/lottery/next-round', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    const result = await response.json()

    if (result.success) {
      ElMessage.success(result.message || '已进入下一轮')
      // 刷新页面以显示新轮次
      window.location.reload()
    } else {
      ElMessage.warning(result.message || '操作失败')
    }
  } catch (error) {
    console.error('下一轮操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

</script>
<style>
.next-epoch{
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 100px;
    height: 25px;
    border-radius: 12px;
    background-color: #f46b03;
    color: #fff;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    line-height: 25px;
    z-index: 2000;
  }
</style>
