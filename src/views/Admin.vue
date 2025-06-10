<template>
  <div class="admin-container">
    <el-container>
      <el-aside width="200px">
        <div class="admin-sidebar">
          <div class="logo">抽奖系统管理</div>
          <el-menu
            :default-active="activeMenu"
            class="admin-menu"
            router
          >
            <el-menu-item index="/admin/dashboard">
              <el-icon><DataBoard /></el-icon>
              <span>控制面板</span>
            </el-menu-item>
            <el-menu-item index="/admin/awards">
              <el-icon><Trophy /></el-icon>
              <span>奖项管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/participants">
              <el-icon><User /></el-icon>
              <span>人员管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/export">
              <el-icon><Document /></el-icon>
              <span>数据导出</span>
            </el-menu-item>
            <el-menu-item index="/admin/settings">
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </el-menu-item>
          </el-menu>
          <div class="admin-actions">
            <el-button type="primary" @click="goToLottery" plain>
              <el-icon><Back /></el-icon>
              返回抽奖页
            </el-button>
            <el-button type="danger" @click="logout" plain>
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </div>
        </div>
      </el-aside>
      <el-container>
        <el-header>
          <div class="admin-header">
            <div class="header-title">
              <h2>{{ getPageTitle }}</h2>
            </div>
            <div class="header-user">
              <el-dropdown>
                <span class="el-dropdown-link">
                  <el-avatar :size="32" icon="UserFilled" />
                  管理员
                  <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataBoard,
  Trophy,
  User,
  Document,
  Setting,
  Back,
  SwitchButton,
  ArrowDown
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 页面标题
const getPageTitle = computed(() => {
  const pathMap = {
    '/admin/dashboard': '控制面板',
    '/admin/awards': '奖项管理',
    '/admin/participants': '人员管理',
    '/admin/export': '数据导出',
    '/admin/settings': '系统设置'
  }
  return pathMap[route.path] || '管理系统'
})

// 返回抽奖页面
const goToLottery = () => {
  router.push('/')
}

// 退出登录
const logout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '退出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    localStorage.removeItem('token')
    ElMessage.success('已退出登录')
    router.push('/')
  } catch (error) {
    if (error === 'cancel') return
    console.error('退出登录失败:', error)
  }
}
</script>

<style lang="scss" scoped>
.admin-container {
  height: 100vh;
  background-color: #f5f7fa;
}

.admin-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #304156;
  color: #fff;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    border-bottom: 1px solid #1f2d3d;
  }
  
  .admin-menu {
    flex: 1;
    border-right: none;
    background-color: #304156;
    
    :deep(.el-menu-item) {
      color: #bfcbd9;
      
      &:hover, &.is-active {
        color: #fff;
        background-color: #263445;
      }
    }
  }
  
  .admin-actions {
    padding: 20px 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.el-aside {
  background-color: #304156;
}

.el-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
}

.admin-header {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .header-title {
    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .header-user {
    .el-dropdown-link {
      display: flex;
      align-items: center;
      cursor: pointer;
      
      .el-avatar {
        margin-right: 8px;
      }
    }
  }
}

.el-main {
  padding: 20px;
}
</style>