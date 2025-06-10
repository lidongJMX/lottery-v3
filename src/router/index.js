import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import AwardManagement from '../views/AwardManagement.vue'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
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

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router