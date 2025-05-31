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
    component: AwardManagement
  },
  {
    path: '/lottery',
    name: 'Lottery',
    component: () => import('@/views/Lottery.vue')
  },

  {
    path: '/participants',
    name: 'Participants',
    component: () => import('@/views/Participants.vue')
  },
  {
    path: '/export',
    name: 'Export',
    component: () => import('@/views/Export.vue')
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

export default router