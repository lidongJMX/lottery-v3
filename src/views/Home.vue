<template>
  <div class="home-container" :style="{ backgroundImage: `url(${currentBackground})` }">
    <div class="background">
      <video class="videoBg" src="../assets/背景视频.mp4" autoplay="autoplay" loop="loop" muted="muted"
        data-src="../assets/背景视频.mp4"
        style="width: 1482px; height: auto; left: 0px; top: 50%; margin-left: 0px; margin-top: -463.125px;">
      </video>
      <!-- <div class="lantern left"></div>
      <div class="lantern right"></div>
      <div class="fireworks"></div> -->
    </div>

    <el-container>
      <!-- <el-header></el-header> -->
      <el-main>
        <div class="content">
          <div class="countdown">
            <span>距离抽奖开始还有：</span>
            <el-countdown :value="countdownDate" />
          </div>

          <div class="lottery-area">
            <div class="lottery-container">
              <div class="left-award">
                <div class="lottory_award_box">
                  <img src="/src/assets/img/prizebg.png" style="width: 210px; height: 210px;">
                  <div class="limitbox">惊喜大奖</div>
                </div>
                <div class="prize_number">
                  <div class="lottory-prev-btn"></div>
                  <div class="lottory-awardname limitbox">一等奖</div>
                  <div class="lottory-next-btn"></div>
                </div>
                <div class="lottory-selectbox">
                  <img id="prize_decrement" src="/src/assets/img/reduce.png">
                  <input class="numbernum" value="1">
                  <img id="prize_increment" src="/src/assets/img/add.png">
                </div>
                <div class="award-content">
                  <div class="award-title">
                  </div>
                </div>
              </div>
              <div class="right-lottery">

              </div>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>

  <!-- 中奖弹窗 -->
  <el-dialog v-model="showWinnerDialog" title="中奖通知" :width="winnerDialogWidth" custom-class="winner-popup-box" center
    :custom-style="{
      'max-width': '90vw',
      'max-height': '90vh'
    }">
    <div class="winner-popup-content">
      <h2 style="text-align: center; color: #E6A23C; margin-bottom: 0px;">恭喜以下人员中奖！</h2>
      <div class="winner-popup-grid">
        <div v-for="(winner, index) in lastRoundWinners" :key="index" class="winner-popup-item"
          :style="{ backgroundColor: getWinnerColor(winner) + '20' }">
          <div style="font-size: 18px; font-weight: bold;">{{ winner.name }}</div>
          <div style="font-size: 14px; color: #606266;">{{ winner.department || '未知单位' }}</div>
          <div style="font-size: 14px; margin-top: 0px;" :style="{ color: getWinnerColor(winner) }">{{
            getWinnerAwardName(winner) }}</div>
        </div>
      </div>
    </div>
  </el-dialog>

  <!-- 底部导航栏 -->
  <div class="bottom-navigation" @mouseenter="showBottomNav = true" @mouseleave="showBottomNav = false"
    :class="{ 'nav-visible': showBottomNav }">
    <div class="nav-content">
      <div class="nav-item" @click="toggleFullscreen">
        <el-icon>
          <FullScreen />
        </el-icon>
        <span>{{ isFullscreen ? '退出全屏' : '进入全屏' }}</span>
      </div>
      <div class="nav-item" @click="toggleBackgroundMusic">
        <el-icon>
          <SwitchButton />
        </el-icon>
        <span>{{ backgroundMusicEnabled ? '关闭音效' : '开启音效' }}</span>
      </div>
    </div>
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
  Timer,
  FullScreen,
  Aim,
  DataBoard
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
// 删除无用的样式引用

// 添加登录状态检查
const isLoggedIn = computed(() => {
  return !!localStorage.getItem('token')
})

// 定义路由
const router = useRouter()

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}

// 基础设置相关
const meetingTheme = ref('')
const backgroundMusicEnabled = ref(false)
const currentMusicUrl = ref('')
const musicVolume = ref(50)
const audioElement = ref(null)

// 底部导航栏相关
const showBottomNav = ref(false)
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

// 切换背景音乐
const toggleBackgroundMusic = () => {
  backgroundMusicEnabled.value = !backgroundMusicEnabled.value
  if (backgroundMusicEnabled.value) {
    if (currentMusicUrl.value && audioElement.value) {
      audioElement.value.play().catch(error => {
        console.log('播放背景音乐失败:', error)
        ElMessage.warning('播放背景音乐失败，请检查音频文件')
      })
    }
    ElMessage.success('背景音乐已开启')
  } else {
    if (audioElement.value) {
      audioElement.value.pause()
    }
    ElMessage.success('背景音乐已关闭')
  }
  // 保存设置到localStorage
  localStorage.setItem('backgroundMusicEnabled', backgroundMusicEnabled.value.toString())
}

// 背景图片相关
const backgroundOptions = [
  { name: '默认背景', path: '/src/assets/background.png' },
  { name: '背景2', path: '/src/assets/background-2.png' },
  { name: '背景3', path: '/src/assets/backgroud-3.png' },
  { name: '背景4', path: '/src/assets/background-4.png' },
  { name: '背景5', path: '/src/assets/background-5.png' }
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
      callback: () => { }
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
  const texts = ['特等奖', '一等奖', '二等奖', '三等奖']
  return texts[level - 1] || `${level}等奖`
}

// router已在上方定义
const countdownDate = ref(Date.now() + 1000 * 60 * 60 * 24)
const isDrawing = ref(false)
const animationId = ref(null)
const currentAward = ref('')
const isLoadingParticipants = ref(false)
const loadError = ref(false)
const currentRollingName = ref(null)
const rollingInterval = ref(null)
const rollingSpeed = ref(50)
// 全屏状态
const isFullScreen = ref(false)
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

// 右侧中奖名单自动滚动相关数据
const winnerListRef = ref(null)
const winnerListScrollInterval = ref(null)
const isWinnerListScrollPaused = ref(false)

// 所有中奖者（用于底部滚动显示）
const allWinners = computed(() => {
  return winners.value.map(winner => ({
    ...winner,
    color: getWinnerColor(winner),
    award_name: getWinnerAwardName(winner)
  }))
})

// 底部滚动中奖人员相关数据
const scrollPosition = ref(0)
const scrollWidth = ref(0)
const scrollInterval = ref(null)
const isScrollPaused = ref(false)
const isManualScrolling = ref(false)
const lastMouseX = ref(0)

// 初始化底部滚动动画
const initScrollAnimation = () => {
  // 清除可能存在的旧定时器
  if (scrollInterval.value) {
    clearInterval(scrollInterval.value)
  }

  // 设置定时器，每50毫秒移动1像素
  scrollInterval.value = setInterval(() => {
    // 如果暂停或正在手动滚动，则不执行自动滚动
    if (isScrollPaused.value || isManualScrolling.value) return

    // 获取滚动容器的宽度
    const container = document.querySelector('.winner-scroll-container')
    if (container) {
      const scrollContent = container.querySelector('.winner-scroll')
      if (scrollContent) {
        scrollWidth.value = scrollContent.scrollWidth
        const containerWidth = container.clientWidth

        // 如果滚动位置超过内容宽度，重置到起始位置，实现循环滚动
        if (scrollPosition.value >= scrollWidth.value) {
          // 重置到0，实现首尾相接的效果
          scrollPosition.value = 0
        } else {
          // 否则继续滚动
          scrollPosition.value += 1
        }
      }
    }
  }, 50)
}

// 暂停滚动
const pauseScroll = () => {
  isScrollPaused.value = true
}

// 恢复滚动
const resumeScroll = () => {
  if (!isManualScrolling.value) {
    isScrollPaused.value = false
  }
}

// 开始手动滚动
const startManualScroll = (event) => {
  isManualScrolling.value = true
  lastMouseX.value = event.clientX
}

// 结束手动滚动
const endManualScroll = () => {
  isManualScrolling.value = false
  // 如果鼠标不在容器上，恢复自动滚动
  if (!isScrollPaused.value) {
    resumeScroll()
  }
}

// 处理手动滚动
const handleManualScroll = (event) => {
  if (!isManualScrolling.value) return

  const deltaX = event.clientX - lastMouseX.value
  scrollPosition.value -= deltaX * 2 // 乘以2使滚动更明显

  // 获取滚动内容的宽度
  const container = document.querySelector('.winner-scroll-container')
  const scrollContent = container?.querySelector('.winner-scroll')

  if (container && scrollContent) {
    const contentWidth = scrollContent.scrollWidth

    // 循环滚动处理：确保滚动位置在有效范围内
    if (scrollPosition.value < 0) {
      // 如果滚动到最左侧之前，跳转到最右侧
      scrollPosition.value = contentWidth - 1
    } else if (scrollPosition.value >= contentWidth) {
      // 如果滚动到最右侧之后，跳转到最左侧
      scrollPosition.value = 0
    }
  }

  lastMouseX.value = event.clientX
}

// 初始化右侧中奖名单自动滚动
const initWinnerListScroll = () => {
  // 清除可能存在的旧定时器
  if (winnerListScrollInterval.value) {
    clearInterval(winnerListScrollInterval.value)
    winnerListScrollInterval.value = null
  }

  // 使用requestAnimationFrame实现连续平滑滚动
  let lastTime = 0
  const scrollSpeed = 0.5 // 每帧滚动像素数，可调整滚动速度

  const smoothScroll = (currentTime) => {
    // 如果暂停滚动，继续下一帧但不执行滚动
    if (isWinnerListScrollPaused.value) {
      winnerListScrollInterval.value = requestAnimationFrame(smoothScroll)
      return
    }

    const winnerList = winnerListRef.value
    if (winnerList && lastRoundWinners.value.length > 0) {
      // 控制滚动频率，避免过快
      if (currentTime - lastTime >= 16) { // 约60fps
        const scrollTop = winnerList.scrollTop
        const scrollHeight = winnerList.scrollHeight
        const clientHeight = winnerList.clientHeight

        // 实现循环滚动效果
        if (scrollTop + clientHeight >= scrollHeight - 10) {
          // 当滚动到底部时，立即回到顶部，实现循环效果
          winnerList.scrollTop = 0
        } else {
          // 连续向下滚动
          winnerList.scrollTop += scrollSpeed
        }

        lastTime = currentTime
      }
    }

    // 继续下一帧动画
    winnerListScrollInterval.value = requestAnimationFrame(smoothScroll)
  }

  // 开始动画循环
  winnerListScrollInterval.value = requestAnimationFrame(smoothScroll)
}

// 暂停右侧中奖名单滚动
const pauseWinnerListScroll = () => {
  isWinnerListScrollPaused.value = true
}

// 恢复右侧中奖名单滚动
const resumeWinnerListScroll = () => {
  isWinnerListScrollPaused.value = false
}

// 中奖弹窗相关
const showWinnerDialog = ref(false)
const dialogWinners = ref([])
const winnerDialogWidth = ref('400px')

// 获取中奖者颜色
const getWinnerColor = (winner) => {
  return winner.color || getAwardColor(winner.award_id) || '#ff4d4d'
}

// 获取中奖者奖项名称
const getWinnerAwardName = (winner) => {
  return winner.award_name || winner.award || awards.value.find(a => a.id === winner.award_id)?.name || '未知奖项'
}


// 滚动动画相关数据
const displayNames = ref([])
const rollingOffset = ref(0)
// 计算中心位置索引
const centerIndex = computed(() => {
  const containerHeight = 300
  const centerY = containerHeight / 2
  return Math.floor((rollingOffset.value + centerY) / itemHeight.value)
})
const itemHeight = ref(100) // 每个名字项的高度，匹配CSS中的height: 100px
const scrollSpeed = ref(20) // 滚动速度
const isStopping = ref(false) // 是否正在停止

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
      '确定要删除 ${winner.name} 的 ${winner.award_name} 中奖记录吗？此操作将恢复该参与者状态/lottery')
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
  } catch (error) {
    console.error('删除中奖者错误:', error)
  }



  // 组件卸载时移除监听器
  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullScreenChange)

    // 清理底部滚动定时器
    if (scrollInterval.value) {
      clearInterval(scrollInterval.value)
      scrollInterval.value = null
    }

    // 清理右侧中奖名单自动滚动动画
    if (winnerListScrollInterval.value) {
      cancelAnimationFrame(winnerListScrollInterval.value)
      winnerListScrollInterval.value = null
    }
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
    // 奖项选择变化处理
  }

  // 选择奖项
  const selectAward = (awardName) => {
    // 如果是已抽完的奖项，不允许选择
    const award = awards.value.find(a => a.name === awardName)
    if (award && award.remaining_count <= 0) {
      ElMessage.warning('该奖项已抽完，无法选择')
      return
    }

    currentAward.value = awardName
    handleAwardChange()
    ElMessage.success(`已选择奖项: ${awardName}`)
  }


  // 开始抽奖
  const startLottery = async () => {
    if (isDrawing.value) return

    // 检查是否还有剩余奖项
    const award = awards.value.find(p => p.name === currentAward.value)
    console.log('当前奖项:', award)
    if (!award || award.remaining_count <= 0) {
      ElMessage.warning('当前奖项已抽完！')
      return
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

      // 初始化显示名单
      displayNames.value = [...availableParticipantsList]
      rollingOffset.value = 0
      scrollSpeed.value = 20 // 初始滚动速度
      isStopping.value = false

      // 更新当前高亮的名字
      const updateCurrentName = () => {
        const containerHeight = 300
        const centerY = containerHeight / 2
        const index = Math.floor((rollingOffset.value + centerY) / itemHeight.value)
        if (index >= 0 && index < displayNames.value.length) {
          currentRollingName.value = displayNames.value[index]
        }
      }

      // 滚动动画函数
      const rollAnimation = () => {
        if (!isDrawing.value) return

        // 如果正在停止，逐渐减速
        if (isStopping.value) {
          scrollSpeed.value *= 0.95
          if (scrollSpeed.value < 0.5) {
            // 停止时对齐到最近的名字
            alignFinal()
            isDrawing.value = false
            return
          }
        }

        // 连续滚动
        rollingOffset.value += scrollSpeed.value

        // 当滚动超过一个项目高度时，将第一项移到末尾
        if (rollingOffset.value >= itemHeight.value) {
          rollingOffset.value -= itemHeight.value
          // 将第一个名字移到末尾
          const firstItem = displayNames.value.shift()
          displayNames.value.push(firstItem)
        }

        updateCurrentName()
        animationId.value = requestAnimationFrame(rollAnimation)
      }

      // 停止时对齐函数
      const alignFinal = () => {
        if (rollingOffset.value < itemHeight.value / 2) {
          // 向下对齐到0
          rollingOffset.value = 0
        } else {
          // 向上完成一个循环
          const firstItem = displayNames.value.shift()
          displayNames.value.push(firstItem)
          rollingOffset.value = 0
        }
        updateCurrentName()
        isStopping.value = false
      }

      // 开始滚动动画
      updateCurrentName()
      animationId.value = requestAnimationFrame(rollAnimation)

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

    // 触发减速停止
    isStopping.value = true
    clearInterval(rollingInterval.value)

    // 找到对应的奖项
    const award = awards.value.find(p => p.name === currentAward.value)
    if (!award) return
    const awards_to_draw = [award]
    try {
      const response = await fetch('/api/lottery/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          awards_to_draw: awards_to_draw,
          // participants: availableParticipants.value,
        })
      });
      console.log('参与者:', availableParticipants)
      if (!response.ok) throw new Error('抽奖结果获取失败')
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
        // 将displayNames替换为中奖者，使rolling-container显示中奖者
        displayNames.value = [{ name: drawnWinners[0].name }]
        rollingOffset.value = 0
      } else {
        currentRollingName.value = { name: `${drawnWinners.length}人中奖` }
        // 多人中奖时，显示所有中奖者
        displayNames.value = drawnWinners.map(winner => ({ name: winner.name }))
        rollingOffset.value = 0
      }

      // 播放中奖音效
      playWinnerSound()
      // 刷新中奖列表
      loadWinners()

      // 弹窗展示中奖人员信息
      if (drawnWinners.length > 0) {
        console.log('显示中奖弹窗', drawnWinners[1])
        // 设置弹窗数据
        dialogWinners.value = drawnWinners
        // 根据中奖人数动态调整弹窗宽度
        if (drawnWinners.length <= 2) {
          winnerDialogWidth.value = '400px'
        } else if (drawnWinners.length <= 4) {
          winnerDialogWidth.value = '600px'
        } else if (drawnWinners.length <= 6) {
          winnerDialogWidth.value = '800px'
        } else {
          winnerDialogWidth.value = '1000px'
        }
        showWinnerDialog.value = true
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
      localStorage.removeItem('token');
      ElMessage.success('已退出登录');
      router.push('/');
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

      // 显示成功消息
      ElMessage.success('所有数据已清空')
    } catch (error) {
      if (error === 'cancel') return
      console.error('清空数据失败:', error)
      ElMessage.error('清空失败，请稍后重试')
    }
  }

  // 切换全屏功能
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      // 进入全屏
      document.documentElement.requestFullscreen().then(() => {
        isFullScreen.value = true
        ElMessage.success('已进入全屏模式')
      }).catch(err => {
        console.error('进入全屏失败:', err)
        ElMessage.error('进入全屏失败，请检查浏览器权限')
      })
    } else {
      // 退出全屏
      document.exitFullscreen().then(() => {
        isFullScreen.value = false
        ElMessage.success('已退出全屏模式')
      }).catch(err => {
        console.error('退出全屏失败:', err)
        ElMessage.error('退出全屏失败')
      })
    }
  }

  // // 监听全屏状态变化
  // const handleFullScreenChange = () => {
  //   isFullScreen.value = !!document.fullscreenElement
  // }

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

  // 加载基础设置
  const loadBasicSettings = async () => {
    try {
      // 从数据库API加载设置
      const response = await fetch('/api/settings')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const data = result.data

          // 更新设置数据
          meetingTheme.value = data.meetingTheme || '年会抽奖系统'
          backgroundMusicEnabled.value = data.backgroundMusicEnabled || false
          currentMusicUrl.value = data.currentMusicUrl || ''
          musicVolume.value = data.musicVolume !== undefined ? data.musicVolume : 50

          // 同步到localStorage作为备份
          localStorage.setItem('meetingTheme', meetingTheme.value)
          localStorage.setItem('backgroundMusicEnabled', backgroundMusicEnabled.value.toString())
          localStorage.setItem('currentMusicUrl', currentMusicUrl.value)
          localStorage.setItem('musicVolume', musicVolume.value.toString())

          // 初始化背景音乐
          if (backgroundMusicEnabled.value && currentMusicUrl.value) {
            initBackgroundMusic()
          }
          return
        }
      }
    } catch (error) {
      console.error('从数据库加载设置失败，使用localStorage备份:', error)
    }

    // 如果API调用失败，则从localStorage加载
    const savedTheme = localStorage.getItem('meetingTheme')
    if (savedTheme) {
      meetingTheme.value = savedTheme
    }


    const musicEnabled = localStorage.getItem('backgroundMusicEnabled')
    backgroundMusicEnabled.value = musicEnabled === 'true'

    const savedMusicUrl = localStorage.getItem('currentMusicUrl')
    if (savedMusicUrl) {
      currentMusicUrl.value = savedMusicUrl
    }

    const savedVolume = localStorage.getItem('musicVolume')
    if (savedVolume) {
      musicVolume.value = parseInt(savedVolume)
    }

    // 初始化背景音乐
    if (backgroundMusicEnabled.value && currentMusicUrl.value) {
      initBackgroundMusic()
    }
  }

  // 初始化背景音乐
  const initBackgroundMusic = () => {
    if (!audioElement.value) {
      audioElement.value = new Audio()
      audioElement.value.loop = true
      audioElement.value.volume = musicVolume.value / 100
    }

    if (currentMusicUrl.value) {
      audioElement.value.src = currentMusicUrl.value
      // 自动播放背景音乐（需要用户交互后才能播放）
      audioElement.value.play().catch(error => {
        console.log('背景音乐自动播放失败，需要用户交互:', error)
      })
    }
  }

  // 页面初始化
  onMounted(() => {
    loadBasicSettings()
    loadawards()
    loadWinners()
    loadParticipants()

    // 加载保存的背景图片
    const savedBackground = localStorage.getItem('lottery_background')
    if (savedBackground) {
      currentBackground.value = savedBackground
    }

    // 加载保存的倒计时时间
    const savedDateTime = localStorage.getItem('lotteryDateTime')
    if (savedDateTime) {
      countdownDate.value = parseInt(savedDateTime)
    }

    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', handleFullScreenChange)
  })

  // 页面卸载时清理
  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullScreenChange)
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value = null
    }
  })
}
</script>

<style lang="scss" scoped>
.home-container {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
  background-size: cover;
  background-position: center;
  overflow: hidden;
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

  .videoBg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1;
  }
}

.el-header {
  background-color: rgba(var(--warm-white-rgb), 0.95);
  color: var(--text-color);
  padding: 0 20px;
  border-bottom: 1px solid rgba(var(--deep-red-rgb), 0.15);

  .nav-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;

    .logo {
      font-size: 22px;
      font-weight: bold;
      color: var(--primary-color);
    }

    .nav-menu {
      background: transparent;
      border-bottom: none;
      color: white !important;

      :deep(.el-menu-item) {
        color: var(--text-color);
        font-size: 1rem;
        height: 60px;
        line-height: 60px;

        &:hover {
          color: var(--deep-red);
        }

        &.is-active {
          color: var(--deep-red);
          border-bottom: 2px solid var(--deep-red);
        }

        .el-icon {
          margin-right: 5px;
        }
      }
    }

    .nav-dropdown {
      .el-dropdown-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 4px;
        background-color: rgba(var(--primary-color-rgb), 0.1);
        transition: all 0.2s ease;

        &:hover {
          background-color: rgba(var(--primary-color-rgb), 0.2);
        }

        .el-icon {
          font-size: 18px;
          color: var(--primary-color);
        }
      }
    }
  }
}

// 背景选择器样式
:deep(.background-selector) {
  padding: 15px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid rgba(var(--primary-color-rgb), 0.1);

  h3 {
    text-align: center;
    margin-bottom: 15px;
    color: white;
    font-size: 14px;
  }

  .background-options {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    justify-content: center;

    .bg-option {
      width: 120px;
      height: 80px;
      border-radius: 4px;
      background-size: cover;
      background-position: center;
      cursor: pointer;
      position: relative;
      border: 1px solid rgba(var(--primary-color-rgb), 0.1);
      transition: all 0.2s ease;
      overflow: hidden;

      &:hover {
        border-color: rgba(var(--primary-color-rgb), 0.3);
      }

      &.active {
        border-color: var(--primary-color);
        border-width: 2px;
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
  padding: 0 0;
  width: 100%;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  // padding: 50  0;
  // max-width: 1400px;
  margin: 50px 0;
  width: 100%;
}


.lottery-area {
  display: flex;
  width: 100%;
  height: 550px;
  // background-color: #fefefe;
  justify-content: center;
  margin-top: 5px;
}

@media (max-width: 1024px) {
  .lottery-area {
    grid-template-columns: 1fr;
  }
}

.lottery-container {
  display: flex;
  max-width: 1100px;
  flex-direction: row;

  // align-items: center;
  // background-color: #141415;

  .left-award {
    background-image: url("../assets/img/leftbg.png");
    background-repeat: no-repeat;
    background-size: cover;
    // background-color: rgba(255, 255, 255, 0.9);
    // height: 100%;
    width: 450px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0;

    .lottory_award_box {
      align-items: center;
      width: 100%;
      height: 260px;
      display: flex;
      color: #fff;
      flex-direction: column;
      justify-content: center;
      margin: 120px 0 10px;

      .limitbox {
        width: 100%;
        text-align: center;
        font-size: 24px;
      }
    }

    .prize_number {
      width: 100%;
      display: flex;
      color: #fff;
      justify-content: center;
      flex-direction: row;
      align-items: center;
      font-size: 24px;
      font-weight: bold;
      margin: 20px 0;

      .lottory-prev-btn {
        width: 30px;
        height: 30px;
        background-image: url("../assets/img/prevbtn.png");
        background-size: cover;
        background-position: center;
      }

      .lottory-awardname {
        width: 30%;
        text-align: center;
      }

      .lottory-next-btn {
        width: 30px;
        height: 30px;
        background-image: url("../assets/img/nextbtn.png");
        background-size: cover;
        background-position: center;
      }
    }

    .lottory-selectbox {
      width: 100%;
      display: flex;
      justify-content: center;
      flex-direction: row;
      align-items: center;
      font-size: 24px;
      font-weight: bold;
      margin: 20px 0;

      .prize_decrement,
      .prize_increment {
        user-select: none;
        color: #fff;
        text-align: center;
        cursor: pointer;
      }

      .numbernum {
        user-select: none;
        width: 80px;
        height: 36px;
        background-color: rgb(255, 255, 255);
        line-height: 36px;
        color: rgb(117, 117, 117);
        text-align: center;
        border: none;
        border-radius: 3px;
        margin: 0 10px;
        font-size: 20px;
        outline: none;
      }
    }

  }

  .right-lottery {
    width: 650px;
    height: 100%;
    background-image: url("../assets/img/rightbg.png");
    background-repeat: no-repeat;
    background-size: cover;
    // background-color: rgba(255, 255, 255, 0.9);
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .winner-container {
    flex: 1;
    max-width: 400px;

    .winner-card {
      border-radius: 20px;
      overflow: hidden;
      background: linear-gradient(145deg, var(--warm-white), #fff8f0);
      border: 3px solid transparent;
      border-image: linear-gradient(45deg, var(--deep-red), var(--gold-color), var(--warm-red)) 1;
      box-shadow: 0 12px 40px rgba(var(--warm-red-rgb), 0.25), 0 8px 25px rgba(var(--gold-color-rgb), 0.18);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      height: 100%;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, rgba(var(--warm-red-rgb), 0.04), rgba(var(--gold-color-rgb), 0.04));
        border-radius: 20px;
        z-index: 0;
      }

      &::after {
        content: '🏆✨';
        position: absolute;
        top: 15px;
        right: 20px;
        font-size: 24px;
        animation: float 3s ease-in-out infinite reverse;
        z-index: 2;
      }

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 60px rgba(var(--warm-red-rgb), 0.35), 0 0 40px rgba(var(--gold-color-rgb), 0.25);
      }

      .winner-content {
        padding: 25px;
        display: flex;
        flex-direction: column;
        height: 100%;
        position: relative;
        z-index: 1;
      }

      .winner-title {
        display: flex;
        align-items: center;
        margin-bottom: 25px;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--deep-red), var(--gold-color), var(--warm-red));
          border-radius: 2px;
          animation: shimmer 2s ease-in-out infinite;
        }

        .winner-icon {
          color: var(--gold-color);
          margin-right: 15px;
          filter: drop-shadow(2px 2px 4px rgba(var(--warm-red-rgb), 0.35));
          animation: bounce 2s ease-in-out infinite;
        }

        h2 {
          font-size: 26px;
          background: linear-gradient(45deg, var(-eep-red), var(--gold-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          font-weight: 800;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }
      }

      .winner-list {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        scroll-behavior: smooth;
        max-height: 400px;
        position: relative;

        &::-webkit-scrollbar {
          width: 8px;
        }

        &::-webkit-scrollbar-track {
          background: rgba(var(--gold-color-rgb), 0.12);
          border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, var(--deep-red), var(--gold-color));
          // border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, var(--warm-red), var(--secondary-color));
        }

        .winner-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          margin-bottom: 12px;
          border-radius: 12px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          background: linear-gradient(135deg, #ffffff, #fefefe);
          border: 2px solid transparent;
          animation: fadeInUp 0.6s ease-out;
          transform-origin: center;
          overflow: hidden;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(var(--gold-color-rgb), 0.25), transparent);
            transition: left 0.6s ease;
          }

          &::after {
            content: '🎉';
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 16px;
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.9);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          &:hover {
            border-color: var(--gold-color);
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 8px 25px rgba(var(--warm-red-rgb), 0.25), 0 0 15px rgba(var(--gold-color-rgb), 0.35);
            background: linear-gradient(135deg, rgba(var(--gold-color-rgb), 0.06), rgba(var(--warm-red-rgb), 0.06));

            &::before {
              left: 100%;
            }

            &::after {
              opacity: 1;
            }

            .delete-winner-btn {
              opacity: 1;
              transform: translateY(-50%) scale(1.1);
            }

            .winner-name {
              color: var(--deep-red);
            }

            .winner-award {
              transform: scale(1.05);
            }
          }

          .winner-name {
            font-size: 15px;
            font-weight: 600;
            color: #333;
            transition: color 0.3s ease;
          }

          .winner-award {
            font-size: 13px;
            font-weight: 700;
            padding: 6px 12px;
            border-radius: 8px;
            background: linear-gradient(45deg, var(--deep-red), var(--gold-color));
            color: #fff;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease;
            box-shadow: 0 2px 8px rgba(var(--warm-red-rgb), 0.35);
          }

          .delete-winner-btn {
            opacity: 0;
            transition: all 0.3s ease;
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 28px;
            height: 28px;
            padding: 0;
            color: var(--deep-red);
            background: rgba(var(--warm-red-rgb), 0.12);
            border-radius: 50%;
            border: 2px solid var(--deep-red);

            &:hover {
              background: var(--deep-red);
              color: white;
              transform: translateY(-50%) scale(1.2);
            }
          }
        }
      }
    }
  }
}

/* 动画定义 */

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
    text-shadow: 0 0 5px rgba(var(--secondary-color-rgb), 0.5);
  }

  50% {
    text-shadow: 0 0 10px rgba(var(--primary-color-rgb), 0.5);
  }
}

@keyframes glow-pulse {

  0%,
  100% {
    box-shadow: 0 0 20px rgba(var(--warm-red-rgb), 0.45);
  }

  50% {
    box-shadow: 0 0 30px rgba(var(--gold-color-rgb), 0.65), 0 0 40px rgba(var(--deep-red-rgb), 0.35);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}

@keyframes bounce {

  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-8px);
  }

  60% {
    transform: translateY(-4px);
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

@keyframes winner-pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }

  50% {
    transform: scale(1.03);
    opacity: 1;
  }
}

/* 中奖弹窗样式 - 扁平化设计 */
.winner-popup-box {
  .el-message-box__header {
    padding: 12px 15px;
    background-color: var(--primary-color);
    border-bottom: none;

    .el-message-box__title {
      color: #fff;
      font-size: 18px;
      font-weight: 500;
    }

    .el-message-box__headerbtn .el-message-box__close {
      color: #fff;
      font-size: 16px;
    }
  }

  .el-message-box__content {
    padding: 15px;
    background-color: #fff;
  }

  .el-message-box__btns {
    background-color: #fff;
    border-top: none;
    padding: 0 15px 15px;

    .el-button--primary {
      background-color: var(--primary-color);
      border: none;
      color: #fff;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}

.winner-popup-content {
  max-height: 70vh;
  overflow-y: auto;

  h2 {
    text-align: center;
    color: var(--primary-color);
    font-size: 20px;
    margin-bottom: 15px;
    font-weight: 500;
  }

  .winner-popup-grid {
    padding: 10px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;

    .winner-popup-item {
      transition: all 0.2s ease;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
      border: 1px solid rgba(var(--primary-color-rgb), 0.1);
      background-color: #fff;

      &:hover {
        border-color: var(--primary-color);
      }

      div:nth-child(1) {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      div:nth-child(2) {
        font-size: 12px;
        color: #606266;
        margin-bottom: 8px;
      }

      div:nth-child(3) {
        font-size: 14px;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
        background-color: rgba(var(--primary-color-rgb), 0.1);
        color: var(--primary-color);
      }
    }
  }
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  33% {
    transform: translateY(-8px) rotate(5deg);
  }

  66% {
    transform: translateY(-3px) rotate(-3deg);
  }
}

@keyframes glow {

  0%,
  100% {
    color: rgba(var(--primary-color-rgb), 0.9);
  }

  50% {
    color: rgba(var(--secondary-color-rgb), 1);
  }
}

@keyframes winner-pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }

  50% {
    transform: scale(1.03);
    opacity: 1;
  }
}

@keyframes shine {
  0% {
    opacity: 0.7;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.7;
  }
}

.countdown {
  // animation: float 4s ease-in-out infinite;
}

/* 底部滚动中奖人员样式 */
.winner-scroll-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(var(--primary-color-rgb), 0.1);
  padding: 10px 0;
  z-index: 10;
  cursor: grab;
  /* 指示可拖动 */
  transition: background-color 0.3s ease;
}

.winner-scroll-container:hover {
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.winner-scroll-container:active {
  cursor: grabbing;
  /* 指示正在拖动 */
}

.winner-scroll-wrapper {
  width: 100%;
  overflow: hidden;
}

.winner-scroll {
  display: flex;
  white-space: nowrap;
  transition: transform 0.1s ease-out;
  /* 使手动滚动更平滑 */
}

.winner-scroll-item {
  display: inline-flex;
  align-items: center;
  margin-right: 30px;
  padding: 5px 10px;
  border-radius: 4px;
  background-color: rgba(var(--primary-color-rgb), 0.03);
  border: 1px solid rgba(var(--primary-color-rgb), 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.winner-scroll-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.winner-scroll-item .winner-name {
  font-weight: 500;
  margin-right: 10px;
  color: var(--text-color);
}

.winner-scroll-item .winner-department {
  font-size: 12px;
  color: #606266;
  margin-right: 10px;
}

.winner-scroll-item .winner-award {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
}

// .lottery-card,
.winner-card {
  position: relative;
  overflow: hidden;
  background-color: #fff;
  border: 1px solid rgba(var(--primary-color-rgb), 0.1);
  border-radius: var(--border-radius-normal, 4px);
  box-shadow: var(--box-shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.08));
  transition: all 0.3s ease;
}

// 响应式样式
@media screen and (max-width: 1200px) {
  .lottery-content-wrapper {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .award-list-panel {
    max-width: 500px;
    margin: 0 auto;
    width: 100%;
    flex: none;
  }
}

@media screen and (max-width: 768px) {
  .nav-container {
    padding: 8px 12px;
    margin: 8px;
  }

  .logo {
    font-size: 18px;
  }

  .lottery-area {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .rolling-name-item {
    font-size: 18px;
    height: 60px;

    &.current-name {
      font-size: 20px;
    }

    &.winner-highlight {
      font-size: 22px;
    }
  }

  .lottery-controls .start-btn,
  .lottery-controls .stop-btn {
    min-width: 90px;
    height: 40px;
    font-size: 14px;
  }

  .winner-popup-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;

    .winner-popup-item {
      padding: 8px;

      div:nth-child(1) {
        font-size: 16px;
      }

      div:nth-child(2) {
        font-size: 11px;
      }

      div:nth-child(3) {
        font-size: 12px;
        padding: 3px 6px;
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .el-header {
    .nav-container {
      flex-direction: column;
      padding: 8px 0;

      .logo {
        margin-bottom: 8px;
      }

      .nav-menu {
        width: 100%;
      }
    }
  }

  .header .title {
    font-size: 1.8rem;
  }

  .lottery-area {
    flex-direction: column;
    align-items: center;
  }

  .lottery-container,
  .winner-container {
    width: 95%;
    max-width: none;
  }

  .lottery-card,
  .winner-card {
    height: 450px;
  }
}

/* 底部导航栏样式 */
.bottom-navigation {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(100%);
  background: #141415;
  backdrop-filter: blur(10px);
  border-radius: 20px 20px 0 0;
  padding: 15px 30px;
  z-index: 1000;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 300px;
  opacity: 0.5;
}

.bottom-navigation:hover,
.bottom-navigation.nav-visible {
  transform: translateX(-50%) translateY(0);
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
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.9);
  color: rgba(255, 255, 255, 1);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.nav-item .el-icon {
  font-size: 1.1rem;
}

.nav-item span {
  font-weight: 500;
  white-space: nowrap;
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