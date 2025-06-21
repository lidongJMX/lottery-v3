<template>
  <!-- 底部导航条触发区域 -->
  <div class="bottom-nav-trigger" @mouseenter="showBottomNav = true" @mouseleave="showBottomNav = false">
  </div>

  <!-- 底部导航条 -->
  <div class="bottom-navigation" @mouseenter="showBottomNav = true" @mouseleave="showBottomNav = false"
    :class="{ 'nav-visible': showBottomNav }">
    <div class="nav-content">
      <div class="nav-item" @click="router.push('/')">
        <el-icon>
          <DataBoard />
        </el-icon>
        <span>主页</span>
      </div>
      <div class="nav-item" @click="router.push('/home')">
        <el-icon>
          🎰
        </el-icon>
        <span>老虎机</span>
      </div>
      <div class="nav-item" @click="router.push('/mingdan')">
        <el-icon>
          <Trophy />
        </el-icon>
        <span>名单抽奖</span>
      </div>
      <div class="nav-item" @click="router.push('/export')">
        <el-icon>
          <Download />
        </el-icon>
        <span>导出数据</span>
      </div>
      <div class="nav-item" @click="toggleFullscreen">
        <el-icon>
          <FullScreen />
        </el-icon>
        <span>全屏模式</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  DataBoard,
  Trophy,
  User,
  Download,
  FullScreen
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 定义路由
const router = useRouter()

// 底部导航条显示状态
const showBottomNav = ref(false) // 默认隐藏导航栏
const isFullscreen = ref(false)

// 全屏控制
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true
      ElMessage.success('已进入全屏模式')
    }).catch(err => {
      ElMessage.error('进入全屏失败: ' + err.message)
    })
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
      ElMessage.success('已退出全屏模式')
    }).catch(err => {
      ElMessage.error('退出全屏失败: ' + err.message)
    })
  }
}

// 监听全屏状态变化
const handleFullScreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 组件挂载时添加事件监听
onMounted(() => {
  // 监听全屏状态变化
  document.addEventListener('fullscreenchange', handleFullScreenChange)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullScreenChange)
})
</script>

<style lang="scss" scoped>
/* 底部导航条触发区域 */
.bottom-nav-trigger {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 15px;
  z-index: 999;
  background: transparent;
  cursor: pointer;
}

/* 底部导航栏样式 */
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 70px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  padding: 10px 30px;
  z-index: 2000;
  transition: all 0.3s ease;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  opacity: 0;
  transform: translateY(100%);
  visibility: hidden; /* 默认隐藏 */
  pointer-events: auto; /* 确保可以点击 */
}

.bottom-navigation:hover,
.bottom-navigation.nav-visible {
  opacity: 1;
  transform: translateY(0);
  visibility: visible;
}

.bottom-navigation::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.nav-content {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex-wrap: wrap;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border-radius: 12px;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  border: none;
  min-width: 70px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.nav-item .el-icon {
  font-size: 1.2rem;
}

.nav-item span {
  font-weight: 600;
  white-space: nowrap;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .bottom-navigation {
    min-width: 250px;
    padding: 12px 20px;
  }

  .nav-content {
    gap: 15px;
  }

  .nav-item {
    padding: 8px 12px;
    font-size: 0.8rem;
  }

  .nav-item span {
    display: none;
  }
}
</style>