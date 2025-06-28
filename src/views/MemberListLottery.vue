<template>
  <div class="home-container">
    <div class="background">
    </div>
    <el-container>
      <el-main>
        <el-header class="lottery-header">
          <div class="lottery-headerbg">
            <span class="lottory-awardname">{{ currentAwardName }}</span>
          </div>
          <div class="prizename">苹果手机</div>
        </el-header>
        <div class="lottery-content">
          <div class="content-awardlist" :class="{ hidden: isLotteryRunning }">
            <div class="awardbox">
              <div class="prizeimg">
                <img src="../assets/img/awardbg.png">
              </div>
            </div>
          </div>
          <div class="content-luckbox" :class="{ active: isLotteryRunning }">
            <div class="luckerbox-content">
              <!-- 中心区域显示的人名 -->
              <div 
                v-for="name in centerNames" 
                :key="name.id"
                class="center-name"
                :style="{
                  left: name.x + '%',
                  top: name.y + '%',
                  transform: `scale(${name.scale})`,
                  opacity: name.opacity
                }"
              >
                {{ name.name }}
              </div>
              <!-- 飞出的人名 -->
              <div 
                v-for="name in flyingNames" 
                :key="name.id"
                class="flying-name"
                :style="{
                  left: name.x + '%',
                  top: name.y + '%',
                  transform: `scale(${name.scale})`,
                  opacity: name.opacity
                }"
              >
                {{ name.name }}
              </div>
            </div>
          </div>
          <!-- 停止提示 -->
          <div class="lottery-stoptip" :class="{ active: isLotteryRunning }">
            <div class="stoptip-text">按空格键停止抽奖</div>
          </div>
        </div>
        <el-footer class="lottery-footer" :class="{ hidden: isLotteryRunning }">
          <div class="footer-bg">
            <div class="lottory-number">
              <div class="lottory-prev-btn" @click="prevAward" title="上一个奖项"></div>
              <div class="active-awardname limitbox">{{ currentAwardName }}</div>
              <div class="lottory-next-btn" @click="nextAward" title="下一个奖项"></div>
            </div>
            <div class="lottory-drawcountbox">
              <img id="prize_decrement" src="/src/assets/img/reduce.png" @click="decrementDrawCount" title="减少抽取人数">
              <input class="numbernum" :value="currentDrawCount" readonly>
              <img id="prize_increment" src="/src/assets/img/add.png" @click="incrementDrawCount" title="增加抽取人数">
            </div>
            <div class="lottory-startbtn">
              <el-button type="primary" @click="startLottery" :disabled="isLotteryRunning">
                {{ isLotteryRunning ? '抽奖中...' : '开始抽奖' }}
              </el-button>
            </div>
            <div class="lottory-selectDialog" @click="showWinnerDialog = true" :disabled="isLotteryRunning">中奖名单</div>
          </div>
        </el-footer>
        <div class="lottery-stoptip" style="display: none;">按空格键停止</div>
      </el-main>
    </el-container>
  </div>

  <!-- 引入底部导航栏组件 -->
  <BottomNavigation />
  <!-- 中奖弹窗 -->
  <div v-if="showWinnerDialog" class="winner-popup-overlay" @click="showWinnerDialog = true">
    <div class="winner-popup-box" @click.stop>
      <div class="winner-popup-header">
      </div>
      <div class="winner-popup-close" @click="showWinnerDialog = false"></div>
      <div class="winner-popup-content">
        <div class="winner-popup-header-title">
          <h5>{{ currentAwardName }}</h5>
          <p v-if="currentAwardWinners.length === 0" class="no-winners-text">当前奖项暂无中奖者</p>
        </div>
        <div class="winner-popup-grid">
          <div v-for="(winner, index) in currentAwardWinners" :key="index" class="winner-popup-item"
            :style="{ backgroundColor: getWinnerColor(winner) + '20' }">
            <div style=" font-weight: bold;">{{ winner.name }}</div>
            <div style=" color: #e79f47;">{{ winner.department || '未知单位' }}</div>
            <div @click="deleteWinner(winner)" class="delete-icon">❌</div>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>
<script setup>
import '@/styles/member.scss';
import { ref, onMounted, onUnmounted, computed, h, nextTick } from 'vue'
import BottomNavigation from '../components/BottomNavigation.vue'
import { participantUtils, awardUtils, winnerUtils } from '../utils/lotteryUtils.js'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
// 奖项
const awards = ref([]);
//
const currentAward = ref('')
// 当前奖项索引和抽取人数
const currentAwardIndex = ref(0);
const currentDrawCount = ref(1)
//参与者
const participants = ref([]);
// 获奖者
const winners = ref([]);
//正在加载中
const isLoadingParticipants = ref(false)
// 加载错误
const loadError = ref(false)
// 控制中奖者显示
const showWinners = ref(false)
// 控制序号显示
const showSequenceNumber = ref(true)
// 控制公平提示显示
const showFairnessTip = ref(true)
// 控制是否可以删除中奖者
const canDeleteWinners = ref(true)
// 抽奖状态控制
const isLotteryRunning = ref(false)
// 显示中奖弹窗
const showWinnerDialog = ref(false)
// 当前奖项的中奖者
const currentAwardWinners = ref([])
// 飞出的人名列表
const flyingNames = ref([])
// 中心区域显示的人名列表
const centerNames = ref([])
// 动画定时器
let animationTimer = null

// 键盘事件处理
const handleKeyDown = (event) => {
  if (event.code === 'Space') {
    event.preventDefault()
    if (isLotteryRunning.value) {
      stopLottery()
    }
  }
}

onMounted(() => {
  loadawards()
  loadWinners()
  loadParticipants()
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // 清理键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)
  // 清理定时器
  if (animationTimer) {
    clearInterval(animationTimer)
  }
})
// 加载参与者列表
const loadParticipants = async () => {
  isLoadingParticipants.value = true
  loadError.value = false

  try {
    const lotteryData = await participantUtils.loadParticipants()
    participants.value = lotteryData
    isLoadingParticipants.value = false
  } catch (error) {
    loadError.value = true
    isLoadingParticipants.value = false
  }
}
const loadawards = async (initializeIndex = true) => {
  try {
    const result = await awardUtils.loadAwards(initializeIndex)
    awards.value = result.data

    // 只在首次加载时初始化当前奖项
    if (initializeIndex && result.data.length > 0) {
      currentAwardIndex.value = 0
      currentAward.value = result.data[0].name
      currentDrawCount.value = result.data[0].draw_count || 1
    }
  } catch (error) {
    console.error('获取奖项列表错误:', error)
  }
}
const currentAwardName = computed(() => {
  return selectedAward.value.name || '暂无奖项';
})

// 选中的奖项
const selectedAward = computed(() => {
  if (awards.value.length === 0) {
    return {
      name: '',
      description: '',
      count: 0,
      remaining_count: 0,
      draw_count: 1,
      level: 0
    };
  }

  const award = awards.value[currentAwardIndex.value] || awards.value[0];
  return {
    ...award,
    count: award.count,
    remaining_count: award.remaining_count,
    draw_count: award.draw_count || 1
  };
});

// 加载获奖者
const loadWinners = async () => {
  try {
    const result = await winnerUtils.loadWinners()
    winners.value = result.data
    // 如果有中奖者数据，显示中奖者列表
    if (result.data && result.data.length > 0) {
      showWinners.value = true
    }
  } catch (error) {
    console.error('获取获奖者列表错误:', error)
    ElMessage.error('获取中奖名单失败，请稍后重试')
  }
}

// 显示的中奖者列表（可以根据当前奖项过滤）
const displayWinners = computed(() => {
  if (!winners.value || winners.value.length === 0) {
    return []
  }
  // 可以根据当前选中的奖项过滤中奖者
  return winners.value.filter(winner => {
    if (!selectedAward.value.name) return true
    return winner.award_name === selectedAward.value.name
  })
})

// 删除中奖者
const deleteWinner = async (winnerId) => {
  try {
    await winnerUtils.deleteWinner(winnerId)
    ElMessage.success('删除中奖者成功')
    // 重新加载中奖者列表
    await loadWinners()
    // 重新加载参与者列表
    await loadParticipants()
  } catch (error) {
    console.error('删除中奖者错误:', error)
    ElMessage.error('删除中奖者失败，请稍后重试')
  }
}

// 切换中奖者显示状态
const toggleWinnersDisplay = () => {
  showWinners.value = !showWinners.value
}

// 开始抽奖
const startLottery = () => {
  if (isLotteryRunning.value) return
  
  // 检查是否有参与者
  if (!participants.value || participants.value.length === 0) {
    ElMessage.warning('暂无参与者！')
    return
  }
  
  isLotteryRunning.value = true
  showWinnerDialog.value = false
  
  // 开始人名飞出动画
  startFlyingAnimation()
}

// 停止抽奖
const stopLottery = () => {
  if (!isLotteryRunning.value) return
  
  isLotteryRunning.value = false
  
  // 停止动画
  if (animationTimer) {
    clearInterval(animationTimer)
    animationTimer = null
  }
  
  // 清空飞出的人名和中心区域人名
  flyingNames.value = []
  centerNames.value = []
  
  // 随机选择中奖者
  selectWinners()
}

// 开始人名飞出动画
const startFlyingAnimation = () => {
  // 初始化中心区域人名
  updateCenterNames()
  
  // 中心区域人名更新定时器
  const centerTimer = setInterval(() => {
    if (!isLotteryRunning.value) {
      clearInterval(centerTimer)
      return
    }
    updateCenterNames()
  }, 800) // 每800ms更新中心区域人名
  
  // 飞出动画定时器
  animationTimer = setInterval(() => {
    if (!isLotteryRunning.value) return
    
    // 从中心区域内侧开始飞出人名
     if (participants.value.length > 0) {
       const randomParticipant = participants.value[Math.floor(Math.random() * participants.value.length)]
       
       // 从中心点附近开始（48%-52%的区域，更靠近中心）
       const startX = 48 + Math.random() * 4
       const startY = 48 + Math.random() * 4
       
       // 计算从中心向外的角度
       const centerX = 50
       const centerY = 50
       const deltaX = startX - centerX
       const deltaY = startY - centerY
       let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
       
       // 如果太接近中心，随机选择一个角度
       if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
         angle = Math.random() * 360
       }
       
       // 创建飞出的人名对象
       const flyingName = {
         id: Date.now() + Math.random(),
         name: randomParticipant.name,
         x: startX,
         y: startY,
         angle: angle, // 从中心向外的角度
         speed: 1.0 + Math.random() * 1.5, // 适中的速度：1.0-2.5
         scale: 0.3, // 从小开始
         opacity: 1,
         targetScale: 0.8 + Math.random() * 0.4,
         scaleGrowth: 0.015 // 大小增长速度
       }
       
       flyingNames.value.push(flyingName)
     }
    
    // 限制飞出人名数量
    if (flyingNames.value.length > 80) {
      flyingNames.value.shift()
    }
  }, 150) // 每150ms生成一个飞出的人名
  
  // 动画更新循环
  const updateAnimation = () => {
    if (!isLotteryRunning.value) return
    
    flyingNames.value = flyingNames.value.filter(name => {
      // 更新位置
      const radians = (name.angle * Math.PI) / 180
      name.x += Math.cos(radians) * name.speed
      name.y += Math.sin(radians) * name.speed
      
      // 更新大小：从小到大，但不超过目标大小
      if (name.scale < name.targetScale) {
        name.scale += name.scaleGrowth
        if (name.scale > name.targetScale) {
          name.scale = name.targetScale
        }
      }
      
      // 计算距离中心的距离来控制透明度
      const centerX = 50
      const centerY = 50
      const distanceFromCenter = Math.sqrt(
        Math.pow(name.x - centerX, 2) + Math.pow(name.y - centerY, 2)
      )
      
      // 距离中心越远，透明度越低
      if (distanceFromCenter > 15) {
        name.opacity -= 0.012
      } else if (distanceFromCenter > 10) {
        name.opacity -= 0.006
      }
      
      // 移除飞出屏幕或完全透明的人名
      return name.x > -20 && name.x < 120 && name.y > -20 && name.y < 120 && name.opacity > 0
    })
    
    requestAnimationFrame(updateAnimation)
  }
  
  updateAnimation()
}

// 更新中心区域显示的人名
const updateCenterNames = () => {
  const nameCount = 10 + Math.floor(Math.random() * 6) // 10-15个人名
  const newCenterNames = []
  
  for (let i = 0; i < nameCount; i++) {
    const randomParticipant = participants.value[Math.floor(Math.random() * participants.value.length)]
    
    // 在中心区域内随机分布（45%-55%的区域，更集中）
    const centerName = {
      id: Date.now() + Math.random() + i,
      name: randomParticipant.name,
      x: 45 + Math.random() * 10, // 45%-55%的横向位置
      y: 45 + Math.random() * 10, // 45%-55%的纵向位置
      scale: 0, // 从0开始
      opacity: 0, // 从0开始
      targetScale: 0.8 + Math.random() * 0.4,
      targetOpacity: 0.9 + Math.random() * 0.1,
      animationProgress: 0 // 动画进度
    }
    
    newCenterNames.push(centerName)
  }
  
  centerNames.value = newCenterNames
  
  // 启动渐现动画
  animateCenterNames()
}

// 中心区域人名渐现动画
const animateCenterNames = () => {
  const animateStep = () => {
    if (!isLotteryRunning.value) return
    
    let allAnimationsComplete = true
    
    centerNames.value.forEach(name => {
      if (name.animationProgress < 1) {
        name.animationProgress += 0.02 // 控制动画速度
        
        // 使用缓动函数实现从小到大的效果
        const easeProgress = 1 - Math.pow(1 - name.animationProgress, 3)
        name.scale = name.targetScale * easeProgress
        name.opacity = name.targetOpacity * easeProgress
        
        allAnimationsComplete = false
      }
    })
    
    if (!allAnimationsComplete) {
      requestAnimationFrame(animateStep)
    }
  }
  
  requestAnimationFrame(animateStep)
}

// 选择中奖者
const selectWinners = () => {
  const drawCount = currentDrawCount.value
  const availableParticipants = participants.value.filter(p => 
    !winners.value.some(w => w.participant_id === p.id)
  )
  
  if (availableParticipants.length === 0) {
    ElMessage.warning('所有参与者都已中奖！')
    return
  }
  
  // 随机选择中奖者
  const selectedWinners = []
  const shuffled = [...availableParticipants].sort(() => Math.random() - 0.5)
  
  for (let i = 0; i < Math.min(drawCount, shuffled.length); i++) {
    selectedWinners.push(shuffled[i])
  }
  
  currentAwardWinners.value = selectedWinners
  showWinnerDialog.value = true
}

// 获取中奖者颜色
const getWinnerColor = (winner) => {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff']
  return colors[Math.abs(winner.name.charCodeAt(0)) % colors.length]
}

// 上一个奖项
const prevAward = () => {
  if (currentAwardIndex.value > 0) {
    currentAwardIndex.value--
    currentDrawCount.value = awards.value[currentAwardIndex.value].draw_count || 1
  }
}

// 下一个奖项
const nextAward = () => {
  if (currentAwardIndex.value < awards.value.length - 1) {
    currentAwardIndex.value++
    currentDrawCount.value = awards.value[currentAwardIndex.value].draw_count || 1
  }
}

// 减少抽取人数
const decrementDrawCount = () => {
  if (currentDrawCount.value > 1) {
    currentDrawCount.value--
  }
}

// 增加抽取人数
const incrementDrawCount = () => {
  const maxCount = Math.min(10, selectedAward.value.remaining_count || 1)
  if (currentDrawCount.value < maxCount) {
    currentDrawCount.value++
  }
}
</script>
