<template>
  <div class="home-container" :style="{ backgroundImage: `url(${currentBackground})` }">
    <div class="background">
      <div class="lantern left"></div>
      <div class="lantern right"></div>
      <div class="fireworks"></div>
    </div>

    <el-container>
      <el-header>
        <div class="nav-container">
          <div class="logo">年会抽奖系统</div>
          
          <!-- 将菜单项放入下拉菜单 -->
          <el-dropdown trigger="click" class="nav-dropdown">
            <span class="el-dropdown-link">
              <!-- <el-button type="primary" icon="el-icon-menu" ></el-button> -->
              <el-icon><More /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <router-link to="/awards">
                    <el-icon><Trophy /></el-icon>
                    <span>奖项管理</span>
                  </router-link>
                </el-dropdown-item>
                <el-dropdown-item>
                  <router-link to="/participants">
                    <el-icon><User /></el-icon>
                    <span>人员管理</span>
                  </router-link>
                </el-dropdown-item>
                <el-dropdown-item @click="exportToExcel">
                  <span>导出中奖名单</span>
                </el-dropdown-item>
                <el-dropdown-item @click="resetLotteryData">
                  <el-icon><Refresh /></el-icon>
                  <span>重置中奖数据</span>
                </el-dropdown-item>
                <el-dropdown-item @click="clearAllData">
                  <el-icon><Delete /></el-icon>
                  <span>清空所有数据</span>
                </el-dropdown-item>
                <el-dropdown-item @click="openBackgroundSelector">
                  <el-icon><Picture /></el-icon>
                  <span>选择背景图片</span>
                </el-dropdown-item>
                <el-dropdown-item @click="openDateTimePicker">
                  <el-icon><Timer /></el-icon>
                  <span>设置抽奖时间</span>
                </el-dropdown-item>
                <el-dropdown-item @click="logout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main>
        <div class="content">
          <!-- <div class="header"> -->
          <!-- <h1 class="title">2024年公司年会抽奖系统</h1> -->
          <div class="countdown">
            <span>距离抽奖开始还有：</span>
            <el-countdown :value="countdownDate" />
          </div>
          <!-- </div> -->

          <div class="lottery-area">
            <div class="lottery-container">
              <el-card class="lottery-card">
                <div class="lottery-content">
                  <div class="lottery-title">
                  </div>

                  <!-- 中央抽奖区 -->
                  <main class="lottery-main">
                    <!-- 添加加载状态和错误提示 -->
                    <div class="loading-error-container" v-if="isLoadingParticipants || loadError">
                      <div v-if="isLoadingParticipants" class="loading-message">
                        <span class="loading-spinner"></span>
                        <span>正在加载参与者列表...</span>
                      </div>
                      <div v-if="loadError" class="error-message">
                        <span>加载参与者列表失败，正在自动重试...</span>
                        <button class="retry-btn" @click="loadParticipants">立即重试</button>
                      </div>
                    </div>

                    <div class="award-selector">
                      <el-select v-model="currentAward" placeholder="请选择奖项" class="award-select"
                        @change="handleAwardChange">
                        <el-option label="轮次抽奖" value="轮次抽奖">
                          <span style="float: left">轮次抽奖</span>
                          <span style="float: right; color: #8492a6; font-size: 13px">
                            抽取所有奖项
                          </span>
                        </el-option>
                        <el-option v-for="award in awards" :key="award.id" :label="award.name" :value="award.name"
                          :disabled="award.remaining_count <= 0">
                          <span style="float: left">{{ award.name }}</span>
                          <span style="float: right; color: #8492a6; font-size: 13px">
                            <el-tag size="small" :type="getLevelType(award.level)">{{ getLevelText(award.level)
                            }}</el-tag>
                            剩余: {{ award.remaining_count }}/{{ award.count }}
                          </span>
                        </el-option>
                      </el-select>
                      <p v-if="selectedAward" class="award-desc">
                        <span>{{ selectedAward.count }}名</span>
                        <span>{{ selectedAward.description }}</span>
                        <span v-if="selectedAward.draw_count > 1">(每次抽取{{ selectedAward.draw_count }}人)</span>
                      </p>
                    </div>

                    <div class="lottery-animation">
                      <transition name="roll">
                        <div class="rolling-name" :class="{ 'winner-highlight': !isDrawing && currentRollingName }">
                          {{ currentRollingName ? currentRollingName.name : '等待开始' }}
                        </div>
                      </transition>
                    </div>

                    <div class="lottery-controls">
                      <div class="control-row">
                        <el-button type="primary" class="start-btn" @click="startLottery"
                          :disabled="isDrawing || participants.length === 0 || (selectedAward && selectedAward.remaining_count <= 0)">
                          {{ isDrawing ? '抽奖中...' : '开始抽奖' }}
                        </el-button>
                        <el-button type="danger" class="stop-btn" @click="stopLottery" :disabled="!isDrawing">
                          停止
                        </el-button>
                      </div>
                    </div>
                  </main>
                </div>
              </el-card>
            </div>

            <div class="winner-container">
              <el-card class="winner-card">
                <div class="winner-content">
                  <div class="winner-title">
                    <el-icon :size="40" class="winner-icon">
                      <Trophy />
                    </el-icon>
                    <h2>中奖名单</h2>
                  </div>
                  <div class="winner-list" style="max-height: 400px; overflow-y: auto;">
                    <div v-for="(winner, index) in lastRoundWinners" :key="index" class="winner-item"
                      :style="{ backgroundColor: winner.color + '10' }">
                      <span class="winner-name">{{ winner.user_code }}</span>
                      <span class="winner-name">{{ winner.name }}</span>
                      <span class="winner-name">{{ winner.department }}</span>
                      <span class="winner-award" :style="{ color: winner.color, backgroundColor: winner.color + '20' }">
                        {{ winner.award_name }}
                      </span>
                      <el-button 
                        type="danger" 
                        size="small" 
                        circle 
                        @click.stop="deleteWinner(winner)" 
                        class="delete-winner-btn"
                        title="删除中奖记录">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  Tickets,
  Trophy,
  User,
  Download,
  Delete,
  Refresh,
  SwitchButton,
  More,
  Picture,
  Timer
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

// 背景图片相关
const backgroundOptions = [
  { name: '默认背景', path: '/src/assets/background.png' },
  { name: '背景2', path: '/src/assets/background-2.png' },
  { name: '背景3', path: '/src/assets/backgroud-3.png' },
  { name: '背景4', path: '/src/assets/background-4.png' }
]
const currentBackground = ref(backgroundOptions[0].path)

// 打开背景选择器
const openBackgroundSelector = () => {
  ElMessageBox.alert(
    h('div', { class: 'background-selector' }, [
      h('h3', '选择背景图片'),
      h('div', { class: 'background-options' }, 
        backgroundOptions.map(bg => 
          h('div', { 
            class: ['bg-option', { active: currentBackground.value === bg.path }],
            onClick: () => selectBackground(bg.path),
            style: { backgroundImage: `url(${bg.path})` }
          }, [
            h('span', bg.name)
          ])
        )
      )
    ]),
    '背景图片选择',
    {
      confirmButtonText: '关闭',
      callback: () => {}
    }
  )
}

// 选择背景图片
const selectBackground = (path) => {
  currentBackground.value = path
  localStorage.setItem('lottery_background', path)
  ElMessage.success('背景图片已更新')
}

// 打开日期时间选择器
const openDateTimePicker = () => {
  ElMessageBox.prompt(
    '',
    '设置抽奖开始时间',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'datetime-local',
      inputValue: dayjs(countdownDate.value).format('YYYY-MM-DDTHH:mm'),
      inputPlaceholder: '请选择抽奖开始时间',
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          const selectedTime = new Date(instance.inputValue).getTime()
          if (isNaN(selectedTime) || selectedTime <= Date.now()) {
            ElMessage.error('请选择一个有效的未来时间')
            return
          }
          countdownDate.value = selectedTime
          localStorage.setItem('lottery_countdown_date', selectedTime.toString())
          ElMessage.success('抽奖开始时间已设置')
        }
        done()
      }
    }
  )
}

// 奖项等级相关的辅助函数
const getLevelType = (level) => {
  const types = ['success', 'warning', 'danger']
  return types[level - 1] || 'info'
}

const getLevelText = (level) => {
  const texts = ['一等奖', '二等奖', '三等奖']
  return texts[level - 1] || `${level}等奖`
}

const router = useRouter()
const countdownDate = ref(Date.now() + 1000 * 60 * 60 * 24)
const isDrawing = ref(false)
const animationId = ref(null)
const currentAward = ref('')
const isLoadingParticipants = ref(false)
const loadError = ref(false)
const currentRollingName = ref(null)
const rollingInterval = ref(null)
const rollingSpeed = ref(50)
// 从API获取参与者列表
const participants = ref([])
const availableParticipants = ref([])
// 奖项设置
const awards = ref([])
// 中奖者列表
const winners = ref([])
// 最后一轮中奖者
const lastRoundWinners = computed(() => {
  if (winners.value.length === 0) return []

  // 找出最后一轮的中奖记录
  const lastRoundId = Math.max(...winners.value.map(w => w.roundId || 0))
  return winners.value.filter(w => (w.roundId || 0) === lastRoundId)
})
// 是否是轮次抽奖模式
const isRoundLottery = ref(false)
// 当前轮次抽奖的奖项索引
const currentRoundIndex = ref(0)

// 加载中奖者列表
const loadWinners = () => {
  // 从API获取最后一轮的中奖者列表
  fetch('/api/lottery/winners/latest-round')
    .then(response => {
      if (!response.ok) throw new Error('获取最后一轮中奖者列表失败')
      return response.json()
    })
    .then(data => {
      // 检查返回的数据结构
      if (!Array.isArray(data)) {
        // 如果返回的不是数组，可能包装在某个字段中
        winners.value = Array.isArray(data.winners) ? data.winners : []
      } else {
        winners.value = data
      }
      // 确保每个winner对象都有roundId
      winners.value = winners.value.map(winner => ({
        ...winner,
        roundId: winner.roundId || winner.round_id || 0
      }))
      console.log('成功获取最后一轮中奖者列表:', winners.value)
    })
    .catch(error => {
      console.error('获取最后一轮中奖者列表错误:', error)
      ElMessage.error('获取中奖名单失败，请稍后重试')
    })
}

// 删除中奖者
const deleteWinner = async (winner) => {
  try {
    // 显示确认对话框
    await ElMessageBox.confirm(
      `确定要删除 ${winner.name} 的 ${winner.award_name} 中奖记录吗？此操作将恢复该参与者状态并增加奖项剩余数量。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    console.log('确认删除', winner)
    // 用户确认后，调用删除API
    const response = await fetch(`/api/winners/${winner.user_code}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) throw new Error('删除失败')

    // 删除成功后刷新数据
    ElMessage.success('删除成功')
    
    // 重新加载中奖者列表
    loadWinners()
    // 重新加载奖项列表
    loadawards()
    // 重新加载参与者列表
    loadParticipants()
  } catch (error) {
    console.error('删除中奖记录失败:', error)
    ElMessage.error('删除失败，请稍后重试')
  }
}

// 初始加载
onMounted(() => {
  // 从localStorage加载背景图片设置
  const savedBackground = localStorage.getItem('lottery_background')
  if (savedBackground) {
    currentBackground.value = savedBackground
  }
  
  // 从localStorage加载抽奖时间设置
  const savedCountdownDate = localStorage.getItem('lottery_countdown_date')
  if (savedCountdownDate) {
    const parsedDate = parseInt(savedCountdownDate)
    if (!isNaN(parsedDate) && parsedDate > Date.now()) {
      countdownDate.value = parsedDate
    } else {
      // 如果保存的时间已过期，设置为默认值（24小时后）
      countdownDate.value = Date.now() + 1000 * 60 * 60 * 24
      localStorage.removeItem('lottery_countdown_date')
    }
  }
  
  loadawards()
  loadWinners()
  // 获取未中奖用户+50%的中奖用户
  fetch('/api/participants/lottery')
    .then(res => {
      if (!res.ok) throw new Error('获取抽奖名单失败')
      return res.json()
    })
    .then(lotteryData => {
      participants.value = lotteryData
      availableParticipants.value = lotteryData
      isLoadingParticipants.value = false
      console.log('成功获取抽奖名单:', lotteryData)
    })
    .catch(error => {
      console.error('获取抽奖名单错误:', error)
      loadError.value = true
    })
})
//     .catch(error => {
//       console.error('获取参与者列表错误:', error)
//       loadError.value = true
//     })
// })
// 获取奖项列表
const loadawards = () => {
  console.log('开始获取奖项列表...')
  fetch('/api/awards')
    .then(response => {
      console.log('奖项列表响应状态:', response.status)
      if (!response.ok) {
        console.error('奖项列表响应异常:', response)
        throw new Error('获取奖项列表失败')
      }
      return response.json()
    })
    .then(data => {
      console.log('成功获取奖项列表:', data)
      awards.value = data
      console.log('奖项列表数据设置成功:', awards)
    })
    .catch(error => {
      console.error('获取奖项列表错误:', error)
      // setTimeout(loadawards, 3000) // 3秒后自动重试
    })
}

const selectedAward = computed(() => {
  if (currentAward.value === '轮次抽奖') {
    const availableAwards = awards.value.filter(p => p.remaining_count > 0);
    // 如果没有可用奖项，返回基本信息但不显示已抽完
    if (availableAwards.length === 0) {
      return {
        name: '轮次抽奖',
        description: '依次抽取所有奖项',
        count: awards.value.reduce((sum, award) => sum + award.count, 0),
        remaining_count: 0, // 保持为1以避免显示已抽完
        draw_count: 1,
        level: 0
      }
    }
    return {
      name: '轮次抽奖',
      description: '依次抽取所有奖项',
      count: availableAwards.reduce((sum, award) => sum + award.count, 0),
      remaining_count: availableAwards.reduce((sum, award) => sum + award.remaining_count, 0),
      draw_count: availableAwards.reduce((sum, award) => sum + (award.draw_count || 1), 0),
      level: 0
    }
  }
  const award = awards.value.find(p => p.name === currentAward.value);
  if (award) {
    return {
      ...award,
      count: award.count,
      remaining_count: award.remaining_count,
      draw_count: award.draw_count || 1
    };
  }
  return {
    name: '',
    description: '',
    count: 0,
    remaining_count: 0,
    draw_count: 1,
    level: 0
  };
});

// 处理奖项选择变化
const handleAwardChange = () => {
  isRoundLottery.value = currentAward.value === '轮次抽奖'
  currentRoundIndex.value = 0
}


// 开始抽奖
const startLottery = async () => {
  if (isDrawing.value) return

  // 轮次抽奖模式
  if (isRoundLottery.value) {
    // 找到所有有剩余数量的奖项
    const availableAwards = awards.value.filter(p => p.remaining_count > 0)
    if (availableAwards.length === 0) {
      ElMessage.warning('所有奖项已抽完！')
      return
    }
    // 设置当前奖项为当前轮次的奖项
    const currentAwards = availableAwards
    if (!currentAwards.length) {
      ElMessage.warning('本轮抽奖已完成！')
      return
    }
    console.log('轮次抽奖模式，当前可用奖项:', currentAwards.map(award => award.name).join(', '))
  } else {
    // 普通模式 - 检查是否还有剩余奖项
    const award = awards.value.find(p => p.name === currentAward.value)
    console.log('当前奖项:', award)
    if (!award || award.remaining_count <= 0) {
      ElMessage.warning('当前奖项已抽完！')
      return
    }
  }

  try {
    // 重新获取可用参与者列表
    const availableParticipantsList = availableParticipants.value

    console.log('可用参与者数量:', availableParticipantsList.length)
    if (availableParticipantsList.length === 0) {
      ElMessage.warning('所有参与者都已中奖！')
      return
    }
    isDrawing.value = true

    // 开始滚动名字
    let index = 0
    rollingInterval.value = setInterval(() => {
      index = Math.floor(Math.random() * availableParticipantsList.length)
      currentRollingName.value = availableParticipantsList[index]
      // 滚动到最后一个参与者时，重新开始
      if (index === availableParticipantsList.length - 1) {
        index = 0
      }
    }, rollingSpeed) // 控制滚动速度

    // 播放抽奖音效
    playLotterySound()
  } catch (error) {
    console.error('抽奖错误:', error)
    ElMessage.error('抽奖过程中出错')
    loadError.value = true
    setTimeout(startLottery, 3000) // 3秒后自动重试
  }
}

// 停止抽奖
const stopLottery = async () => {
  if (!isDrawing.value) return

  clearInterval(rollingInterval.value)
  isDrawing.value = false

  // 找到对应的奖项
  let awards_to_draw = []
  if (isRoundLottery.value) {
    // 轮次抽奖模式 - 获取所有有剩余数量的奖项
    awards_to_draw = awards.value.filter(p => p.remaining_count > 0)
    if (!awards_to_draw.length) return
  } else {
    const award = awards.value.find(p => p.name === currentAward.value)
    if (!award) return
    awards_to_draw = [award]
  }
  try {
    const response = await fetch('/api/lottery/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        awards_to_draw: awards_to_draw,
        participants: availableParticipants.value,
      })
    });

    if (!response.ok) throw new Error(`获取中奖结果失败`)

    const resultData = await response.json()
    const { winners: drawnWinners, updated_awards } = resultData

    // 更新奖项剩余数量
    updated_awards.forEach(updatedAward => {
      const award = awards.value.find(a => a.id === updatedAward.id)
      if (award) {
        award.remaining_count = updatedAward.remaining_count
      }
    })

    // 更新中奖者列表
    if (drawnWinners.length > 0) {
      winners.value = [...winners.value, ...drawnWinners.map(winner => ({
        id: winner.participant_id,
        name: winner.name,
        award: awards.value.find(a => a.id === winner.award_id)?.name || '未知奖项',
        color: getAwardColor(winner.award_id),
        department: winner.department || ''
      }))]

      // 保存到localStorage
      localStorage.setItem('lottery_winners', JSON.stringify(winners.value))

      // 显示中奖消息
      const winnerNames = drawnWinners.map(w => w.name).join(', ')
      const awardNames = [...new Set(drawnWinners.map(w =>
        awards.value.find(a => a.id === w.award_id)?.name || '未知奖项'
      ))].join(', ')

      ElMessage.success(`恭喜 ${winnerNames} 获得 ${awardNames}！`)
    }

    // 更新当前显示的中奖者
    if (drawnWinners.length === 1) {
      currentRollingName.value = { name: drawnWinners[0].name }
    } else {
      currentRollingName.value = { name: `${drawnWinners.length}人中奖` }
    }

    // 播放中奖音效
    playWinnerSound()
    // 刷新中奖列表
    loadWinners()
    // 轮次抽奖模式结束处理
    if (isRoundLottery.value) {
      const remainingAwards = awards.value.filter(p => p.remaining_count > 0)
      if (remainingAwards.length === 0) {
        ElMessage.success('所有奖项抽取完毕！')
        currentRoundIndex.value = 0
        isRoundLottery.value = false
        currentAward.value = ''
      }
    }
  } catch (error) {
    console.error('停止抽奖或处理结果时出错:', error)
    ElMessage.error('处理中奖结果失败')
  }
};
// 辅助函数 - 根据奖项ID获取颜色
const getAwardColor = (awardId) => {
  const award = awards.value.find(a => a.id === awardId)
  if (!award) return '#ff4d4d'

  const colors = ['#ff4d4d', '#ff9800', '#4caf50'] // 红、橙、绿对应不同奖项等级
  return colors[award.level - 1] || '#ff4d4d'
}
// 添加抽奖音效
const playLotterySound = () => {
  // 未来可以添加真实的音效实现
  console.log('播放抽奖音效')
}

// 添加中奖音效
const playWinnerSound = () => {
  // 未来可以添加真实的音效实现
  console.log('播放中奖音效')
}
// 导出中奖名单
const exportToExcel = async () => {
  try {
    console.log('开始导出中奖名单...');
    const response = await fetch('/api/winners/export');
    if (!response.ok) throw new Error('获取中奖记录失败');

    // 将响应转换为blob
    const blob = await response.blob();

    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `中奖名单_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败，请稍后重试');
  }
};
const logout = async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
    localStorage.removeItem('token');
    window.location.href = '/login';
  } catch (error) {
    console.error('退出登录失败:', error);
  }
};
// 重置抽奖数据
const resetLotteryData = async () => {
  try {
    // 显示确认对话框
    await ElMessageBox.confirm(
      '确定要重置所有中奖数据吗？此操作将清空所有中奖记录，恢复所有参与者状态，并重置奖项剩余数量。',
      '重置确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 用户确认后，调用重置API
    const response = await fetch('/api/lottery/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) throw new Error('重置失败')

    const result = await response.json()
    
    // 重新加载数据
    loadawards()
    loadWinners()
    loadParticipants()
    
    // 重置当前状态
    currentRollingName.value = null
    isDrawing.value = false
    currentAward.value = ''
    isRoundLottery.value = false
    currentRoundIndex.value = 0
    
    // 显示成功消息
    ElMessage.success(result.message || '重置成功')
  } catch (error) {
    if (error === 'cancel') return
    console.error('重置抽奖数据失败:', error)
    ElMessage.error('重置失败，请稍后重试')
  }
}

// 清空所有数据
const clearAllData = async () => {
  try {
    // 显示确认对话框
    await ElMessageBox.confirm(
      '确定要清空所有数据吗？此操作将清空所有参与者列表、中奖记录，并重置奖项和轮次数据。此操作不可恢复！',
      '清空确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger',
      }
    )

    // 用户确认后，调用重置API
    const response = await fetch('/api/lottery/clearAllData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) throw new Error('清空失败')

    const result = await response.json()
    
    // 重新加载数据
    loadawards()
    loadWinners()
    loadParticipants()
    
    // 重置当前状态
    currentRollingName.value = null
    isDrawing.value = false
    currentAward.value = ''
    isRoundLottery.value = false
    currentRoundIndex.value = 0
    
    // 显示成功消息
    ElMessage.success('所有数据已清空')
  } catch (error) {
    if (error === 'cancel') return
    console.error('清空数据失败:', error)
    ElMessage.error('清空失败，请稍后重试')
  }
}

// 加载参与者列表
const loadParticipants = () => {
  isLoadingParticipants.value = true
  loadError.value = false
  
  // 获取未中奖用户+50%的中奖用户
  fetch('/api/participants/lottery')
    .then(res => {
      if (!res.ok) throw new Error('获取抽奖名单失败')
      return res.json()
    })
    .then(lotteryData => {
      participants.value = lotteryData
      availableParticipants.value = lotteryData
      isLoadingParticipants.value = false
      console.log('成功获取抽奖名单:', lotteryData)
    })
    .catch(error => {
      console.error('获取抽奖名单错误:', error)
      loadError.value = true
      isLoadingParticipants.value = false
    })
}
</script>

<style lang="scss" scoped>
  .home-container {
    min-height: 100vh;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;
  }

  .background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
  }

  .el-header {
    // background: rgba(255, 255, 255, 0.9);
    background: transparent !important;  // 添加这行使导航背景透明
    color: white;
    padding: 0 20px;
    position: relative;
    z-index: 2;
    // box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;

      .logo {
        font-size: 1.5rem;
        font-weight: bold;
        // color: var(--primary-color);
        color: #ffffff;
        text-decoration: none;
        transition: color 0.3s ease;;
      }

      .nav-menu {
        background: transparent;
        border-bottom: none;
        color: white !important;  // 确保菜单项文字也是白色
        :deep(.el-menu-item) {
          color: #ffffff;
          font-size: 1rem;
          height: 60px;
          line-height: 60px;

          &:hover {
            color: var(--primary-color);
          }

          &.is-active {
            color: var(--primary-color);
            border-bottom: 2px solid var(--primary-color);
          }

          .el-icon {
            margin-right: 5px;
          }
        }
      }
    }
  }

  // 背景选择器样式
  :deep(.background-selector) {
    padding: 10px;
    
    h3 {
      text-align: center;
      margin-bottom: 15px;
      color: var(--primary-color);
    }
    
    .background-options {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: center;
      
      .bg-option {
        width: 120px;
        height: 80px;
        border-radius: 8px;
        background-size: cover;
        background-position: center;
        cursor: pointer;
        position: relative;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        overflow: hidden;
        
        &:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        &.active {
          border-color: var(--primary-color);
          box-shadow: 0 0 10px rgba(var(--primary-color-rgb), 0.5);
        }
        
        span {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 5px;
          font-size: 12px;
          text-align: center;
        }
      }
    }
  }

  .el-main {
    position: relative;
    z-index: 2;
    padding: 20px;
  }

  .content {
    max-width: 100%;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    padding: 40px 0;
    position: relative;

    .title {
      font-size: 3rem;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      background: linear-gradient(45deg, #ffd700, #ff4d4d);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: glow 2s ease-in-out infinite;
    }

    .countdown {
      font-size: 1.5rem;
      margin-top: 5px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    }
  }

  .lottery-area {
    display: flex;
    gap: 20px;
    margin-top: 20px;
    justify-content: center;
  }

  .lottery-container {
    flex: 2;
    max-width: 1200px;

    .lottery-card {
      height: 500px;
      // background: rgba(255, 255, 255, 0.9);
      background: transparent!important;
      border: none;
      // box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      box-shadow: none !important;
      .lottery-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;

        .lottery-title {
          display: flex;
          align-items: center;
          margin-bottom: 30px;

          .lottery-icon {
            color: var(--primary-color);
            margin-right: 10px;
          }

          h2 {
            font-size: 2rem;
            color: var(--primary-color);
            margin: 0;
          }
        }

        .lottery-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          padding: 20px 0;

          .loading-error-container {
            width: 100%;
            padding: 20px;
            text-align: center;

            .loading-message {
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 10px;

              .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                margin-right: 10px;
                border: 2px solid rgba(var(--primary-color-rgb), 0.3);
                border-top-color: var(--primary-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
            }

            .error-message {
              color: #ff4d4d;

              .retry-btn {
                border: none;
                background: #ff4d4d;
                color: white;
                padding: 5px 15px;
                border-radius: 4px;
                margin-left: 10px;
                cursor: pointer;

                &:hover {
                  background: darken(#ff4d4d, 10%);
                }
              }
            }
          }

          .award-title {
            text-align: center;
            margin-bottom: 30px;

            .award-select {
              width: 300px;
              margin-bottom: 10px;

              :deep(.el-input__inner) {
                font-size: 1.2rem;
                color: var(--primary-color);
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
            }

            .award-desc {
              font-size: 1.2rem;
              color: #666;
              margin: 0;
            }
          }

          .lottery-animation {
            width: 100%;
            height: 300px;
            // background: rgba(255, 255, 255, 0.8);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            overflow: hidden;
            position: relative;
            // box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);

            .rolling-name {
              font-size: 5rem;
              font-weight: bold;
              color: #ffffff9c;
              text-align: center;
              transition: transform 0.3s ease, color 0.3s ease;

              &.winner-highlight {
                color: var(--primary-color);
                animation: winner-pulse 2s infinite;
                text-shadow: 0 0 10px rgba(var(--primary-color-rgb), 0.5);
              }
            }
          }

          .lottery-controls {
            width: 100%;

            .control-row {
              display: flex;
              justify-content: center;
              gap: 20px;

              .start-btn,
              .stop-btn {
                width: 150px;
                height: 50px;
                font-size: 1.2rem;
                border: none;
                border-radius: 5px;
              }
            }
          }
        }
      }
    }
  }

  .winner-container {
    flex: 1;
    max-width: 400px;

    .winner-card {
      height: 500px;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      // box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);

      .winner-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 20px;

        .winner-title {
          display: flex;
          align-items: center;
          margin-bottom: 30px;

          .winner-icon {
            color: #ffd700;
            margin-right: 10px;
          }

          h2 {
            font-size: 2rem;
            color: #ffd700;
            margin: 0;
          }
        }

        .winner-list {
          flex: 1;
          overflow-y: auto;
          padding: 5px;

          .winner-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 3px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            margin-bottom: 8px;
            border-radius: 5px;
            transition: all 0.3s ease;
            position: relative;

            &:hover {
              transform: translateX(5px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

              .delete-winner-btn {
                opacity: 1;
              }
            }

            .winner-name {
              font-size: 0.9rem;
              color: #333;
              font-weight: bold;
            }

            .winner-award {
              font-size: 1rem;
              font-weight: bold;
              padding: 5px 10px;
              border-radius: 15px;
            }

            .delete-winner-btn {
              opacity: 0;
              transition: opacity 0.3s ease;
              position: absolute;
              right: 5px;
              top: 50%;
              transform: translateY(-50%);
            }
          }
        }
      }
    }
  }


@keyframes swing {

  0%,
  100% {
    transform: rotate(-5deg);
  }

  50% {
    transform: rotate(5deg);
  }
}

@keyframes sparkle {
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: 50px 50px;
  }
}

@keyframes glow {

  0%,
  100% {
    text-shadow: 0 0 10px #ffd700, 0 0 20px #ff4d4d;
  }

  50% {
    text-shadow: 0 0 20px #ff4d4d, 0 0 30px #ffd700;
  }
}

@keyframes pointer-pulse {

  0%,
  100% {
    transform: translateY(-50%) scale(1);
    opacity: 1;
  }

  50% {
    transform: translateY(-50%) scale(1.2);
    opacity: 0.8;
  }
}

@keyframes scroll-shake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-1px);
  }

  75% {
    transform: translateX(1px);
  }
}

@keyframes flash {
  from {
    background-color: rgba(var(--primary-color-rgb), 0.1);
  }

  to {
    background-color: rgba(var(--primary-color-rgb), 0.3);
  }
}

// @keyframes pulse {
//   0% {
//     box-shadow: 0 0 5px rgba(var(--primary-color-rgb), 0.3);
//   }

//   50% {
//     box-shadow: 0 0 20px rgba(var(--primary-color-rgb), 0.6);
//   }

//   100% {
//     box-shadow: 0 0 5px rgba(var(--primary-color-rgb), 0.3);
//   }
// }

@keyframes winner-pulse {

  0%,
  100% {
    transform: scale(1);
    text-shadow: 0 0 10px rgba(var(--primary-color-rgb), 0.5);
  }

  50% {
    transform: scale(1.05);
    text-shadow: 0 0 20px rgba(var(--primary-color-rgb), 0.8);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media screen and (max-width: 768px) {
  .el-header {
    .nav-container {
      flex-direction: column;
      padding: 10px 0;

      .logo {
        margin-bottom: 10px;
      }

      .nav-menu {
        width: 100%;
      }
    }
  }

  .header .title {
    font-size: 2rem;
  }

  .lottery-area {
    flex-direction: column;
    align-items: center;
  }

  .lottery-container,
  .winner-container {
    width: 90%;
    max-width: none;
  }

  .lottery-card,
  .winner-card {
    height: 400px;
  }
}
</style>