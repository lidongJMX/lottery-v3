import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import AwardManagement from '../views/AwardManagement.vue'
import Login from '../views/Login.vue'
import Admin from '../views/Admin.vue'
import Index from '../views/index.vue'

const routes = [
  {
    path: '/',
    name: 'Index',
    component: Index,
    meta: { requiresAuth: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {

    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true },
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'awards',
        name: 'AdminAwards',
        component: AwardManagement,
        meta: { requiresAuth: true }
      },
      {
        path: 'participants',
        name: 'AdminParticipants',
        component: () => import('@/views/Participants.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'export',
        name: 'AdminExport',
        component: () => import('@/views/Export.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/Settings.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/awards',
    name: 'AwardManagement',
    component: AwardManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/lottery',
    name: 'Lottery',
    component: () => import('@/views/Lottery.vue')
  },

  {
    path: '/participants',
    name: 'Participants',
    component: () => import('@/views/Participants.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/export',
    name: 'Export',
    component: () => import('@/views/Export.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/test',
    name: 'Test',
    component: () => import('@/views/test/lottery-page.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/lotter-demo',
    name: 'LotteryDemo',
    component: () => import('@/components/AdvancedLotteryRoll.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = localStorage.getItem('token')

  // 如果需要认证但未登录，重定向到登录页
  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } 
  // 如果已登录但访问登录页，重定向到管理控制台
  else if (isAuthenticated && to.path === '/login') {
    next('/admin/dashboard')
  }
  // 其他情况正常放行
  else {
    next()
  }
})

export default router