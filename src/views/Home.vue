<template>
  <div class="home-container">
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
                  <img src="/src/assets/img/prizebg.png" style="width: 150px; height: 150px;">
                  <div class="limitbox">{{ currentAwardDescription }}</div>
                </div>
                <div class="prize_number">
                  <div class="lottory-prev-btn" @click="prevAward" title="上一个奖项"></div>
                  <div class="lottory-awardname limitbox">{{ currentAwardName }}</div>
                  <div class="lottory-next-btn" @click="nextAward" title="下一个奖项"></div>
                </div>
                <div class="lottory-selectbox">
                  <img id="prize_decrement" src="/src/assets/img/reduce.png" @click="decrementDrawCount" title="减少抽取人数">
                  <input class="numbernum" :value="currentDrawCount" readonly>
                  <img id="prize_increment" src="/src/assets/img/add.png" @click="incrementDrawCount" title="增加抽取人数">
                </div>

              </div>
              <div class="right-lottery">
                <div class="slot-machine-container">

                  <div class="slot-machine">
                    <!-- 添加顶部和底部的光效 -->
                    <!-- <div class="slot-machine-overlay slot-machine-overlay-top"></div>
                    <div class="slot-machine-overlay slot-machine-overlay-bottom"></div> -->

                    <!-- 添加左右两侧的装饰 -->
                    <!-- <div class="slot-machine-side slot-machine-side-left">
                      <div v-for="n in 5" :key="'left-' + n" class="slot-machine-light"></div>
                    </div>
                    <div class="slot-machine-side slot-machine-side-right">
                      <div v-for="n in 5" :key="'right-' + n" class="slot-machine-light"></div>
                    </div> -->

                    <div class="names-container" ref="namesContainer">
                      <div v-for="participant in displayNames" :key="participant.id" class="name"
                        :class="{ 'name-highlight': Math.random() < 0.1 }">
                        {{ participant.name }}
                      </div>
                    </div>
                  </div>

                  <div class="slot-controls">
                    <div class="slot-btn slot-btn-start" @click="startLottery" :disabled="isSlotRunning"></div>
                    <div class="slot-btn slot-btn-stop" @click="stopLottery" :disabled="!isSlotRunning"></div>
                    <div class="slot-btn slot-btn-showDialog" @click="showWinnerDialog = true"
                      :disabled="isSlotRunning"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>

  <!-- 引入底部导航栏组件 -->
  <BottomNavigation />

  <!-- 中奖弹窗 -->
  <div v-if="showWinnerDialog" class="winner-popup-overlay" @click="showWinnerDialog = false">
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, h, nextTick } from 'vue'
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
  Aim
} from '@element-plus/icons-vue'
import BottomNavigation from '../components/BottomNavigation.vue'
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

// 全屏状态
const isFullscreen = ref(false)

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
// 背景图片
const currentBackground = ref('')
// 从API获取参与者列表
const participants = ref([])
const availableParticipants = ref([])

// 老虎机滚动相关数据
const isSlotRunning = ref(false)
// const slotStatus = ref('点击开始按钮启动抽选')
const namesContainer = ref(null)
const slotAnimationId = ref(null)
const scrollInterval = ref(null);

// 奖项设置
const awards = ref([])
// 中奖者列表
const winners = ref([])

// 当前奖项索引和抽取人数
const currentAwardIndex = ref(0)
const currentDrawCount = ref(1)

// 页面初始化
onMounted(() => {
  // loadBasicSettings()
  loadawards()
  loadWinners()
  loadParticipants()
  console.log('availableParticipants.value', availableParticipants.value)

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

  // 全屏状态变化监听已移至BottomNavigation组件
})
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
// 获取奖项列表
const loadawards = async (initializeIndex = true) => {
  console.log('开始获取奖项列表...')
  try {
    const response = await fetch('/api/awards')
    console.log('奖项列表响应状态:', response.status)
    if (!response.ok) {
      console.error('奖项列表响应异常:', response)
      throw new Error('获取奖项列表失败')
    }
    const data = await response.json()
    console.log('成功获取奖项列表:', data)
    awards.value = data

    // 只在首次加载时初始化当前奖项
    if (initializeIndex && data.length > 0) {
      currentAwardIndex.value = 0
      currentAward.value = data[0].name
      currentDrawCount.value = data[0].draw_count || 1
    }

    console.log('奖项列表数据设置成功:', awards)
  } catch (error) {
    console.error('获取奖项列表错误:', error)
    // setTimeout(() => loadawards(initializeIndex), 3000) // 3秒后自动重试
  }
}

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

// 当前奖项名称
const currentAwardName = computed(() => {
  return selectedAward.value.name || '暂无奖项';
});

// 当前奖项描述
const currentAwardDescription = computed(() => {
  return selectedAward.value.description || '暂无描述';
});


// // 选择奖项
// const selectAward = (awardName) => {
//   // 如果是已抽完的奖项，不允许选择
//   const award = awards.value.find(a => a.name === awardName)
//   if (award && award.remaining_count <= 0) {
//     ElMessage.warning('该奖项已抽完，无法选择')
//     return
//   }

//   currentAward.value = awardName
//   handleAwardChange()
//   ElMessage.success(`已选择奖项: ${awardName}`)
// }

// 切换到上一个奖项
const prevAward = () => {
  if (awards.value.length === 0) return

  currentAwardIndex.value = currentAwardIndex.value > 0
    ? currentAwardIndex.value - 1
    : awards.value.length - 1

  // 更新当前奖项名称和抽取人数
  const award = awards.value[currentAwardIndex.value]
  currentAward.value = award.name
  currentDrawCount.value = award.draw_count || 1

  // ElMessage.success(`切换到: ${currentAwardName.value}`)
}

// 切换到下一个奖项
const nextAward = () => {
  if (awards.value.length === 0) return

  currentAwardIndex.value = currentAwardIndex.value < awards.value.length - 1
    ? currentAwardIndex.value + 1
    : 0

  // 更新当前奖项名称和抽取人数
  const award = awards.value[currentAwardIndex.value]
  currentAward.value = award.name
  currentDrawCount.value = award.draw_count || 1

  // ElMessage.success(`切换到: ${currentAwardName.value}`)
}

// 减少抽取人数
const decrementDrawCount = async () => {
  if (currentDrawCount.value > 1) {
    currentDrawCount.value--
    await updateDrawCountToDatabase()
    // ElMessage.success(`抽取人数已设置为: ${currentDrawCount.value}`)
  } else {
    ElMessage.warning('抽取人数不能少于1人')
  }
}

// 增加抽取人数
const incrementDrawCount = async () => {
  const maxCount = selectedAward.value.remaining_count || 1
  if (currentDrawCount.value < maxCount) {
    currentDrawCount.value++
    await updateDrawCountToDatabase()
    // ElMessage.success(`抽取人数已设置为: ${currentDrawCount.value}`)
  } else {
    ElMessage.warning(`抽取人数不能超过剩余奖项数量: ${maxCount}`)
  }
}

// 更新抽取人数到数据库
const updateDrawCountToDatabase = async () => {
  try {
    const response = await fetch(`/api/awards/${selectedAward.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        draw_count: currentDrawCount.value
      })
    })

    if (!response.ok) {
      throw new Error('更新抽取人数失败')
    }

    // 重新加载奖项列表以同步数据，但不重新初始化当前奖项索引
    await loadawards(false)

    // 确保当前奖项数据是最新的
    if (currentAwardIndex.value < awards.value.length) {
      const award = awards.value[currentAwardIndex.value]
      currentAward.value = award.name
      // currentDrawCount.value 保持用户刚刚设置的值，不需要重新赋值
    }
  } catch (error) {
    console.error('更新抽取人数错误:', error)
    ElMessage.error('更新抽取人数失败')
  }
}
// 最后一轮中奖者
const lastRoundWinners = computed(() => {
  if (winners.value.length === 0) return []

  // 找出最后一轮的中奖记录
  const lastRoundId = Math.max(...winners.value.map(w => w.roundId || 0))
  return winners.value.filter(w => (w.roundId || 0) === lastRoundId)
})

// 当前轮次当前奖项的中奖者
const currentAwardWinners = computed(() => {
  if (winners.value.length === 0 || !currentAward.value) return []

  // 找出最后一轮的中奖记录
  const lastRoundId = Math.max(...winners.value.map(w => w.roundId || w.epoch || 0))

  // 过滤当前轮次且当前奖项的中奖者
  return winners.value.filter(w => {
    const winnerRoundId = w.roundId || w.epoch || 0
    const winnerAwardName = w.award_name || w.award || ''
    return winnerRoundId === lastRoundId && winnerAwardName === currentAward.value
  })
})


// 页面卸载时清理
onUnmounted(() => {
  // 全屏状态变化监听已移至BottomNavigation组件
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }
})


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
// const displayNames = ref([])
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
      // 确保每个winner对象都有roundId和award_name
      winners.value = winners.value.map(winner => ({
        ...winner,
        roundId: winner.roundId || winner.round_id || winner.epoch || 0,
        award_name: winner.award_name || winner.Award?.name || winner.award || '未知奖项'
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
      `确定要删除 ${winner.name} 的 ${winner.award_name} 中奖记录吗？此操作将恢复该参与者状态/lottery`)
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
}

// 处理奖项选择变化
const handleAwardChange = () => {
  // 奖项选择变化处理
}
const displayNames = computed(() => {
  // 复制两倍的名单数据，确保首尾相连的平滑滚动
  return [...participants.value, ...participants.value];
});
// 开始抽奖
const startLottery = async () => {

  // if (isDrawing.value) return
  if (isSlotRunning.value) return

  // 检查是否还有剩余奖项
  const award = selectedAward.value
  console.log('当前奖项:', award)
  if (!award || award.remaining_count <= 0) {
    ElMessage.warning('当前奖项已抽完！')
    return
  }

  // 校验同一轮中同一奖项不能重复抽取
  try {
    const checkResponse = await fetch('/api/lottery/check-round-award', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        award_id: award.id,
        award_name: award.name
      })
    });

    if (!checkResponse.ok) {
      const errorData = await checkResponse.json();
      ElMessage.warning(errorData.message || '校验失败');
      return;
    }
  } catch (error) {
    console.error('校验请求失败:', error);
    ElMessage.error('校验请求失败，请重试');
    return;
  }

  try {
    // 重新获取可用参与者列表
    const availableParticipantsList = availableParticipants.value

    console.log('可用参与者数量:', availableParticipantsList.length)
    if (availableParticipantsList.length === 0) {
      ElMessage.warning('所有参与者都已中奖！')
      return
    }

    // 播放抽奖音效
    playLotterySound()


    isSlotRunning.value = true
    console.log('participants.value.length', participants.value.length)

    // 确保有足够的名字进行滚动
    if (availableParticipants.value.length === 0) {
      isSlotRunning.value = false
      return
    }

    // 清除之前可能存在的动画
    if (slotAnimationId.value) {
      clearInterval(slotAnimationId.value)
    }

    // 重置名字容器样式
    // if (namesContainer.value) {
    //   // 移除所有选中效果
    //   const nameElements = document.querySelectorAll('.slot-machine .name')
    //   console.log("nameElements", nameElements)

    //   nameElements.forEach(name => {
    //     name.classList.remove('selected', 'winner-pulse')
    //     // 随机添加初始高亮效果
    //     if (Math.random() < 0.1) {
    //       name.classList.add('name-highlight')
    //       setTimeout(() => {
    //         name.classList.remove('name-highlight')
    //       }, 1000)
    //     }
    //   })
    // }

    // 添加侧边灯光闪烁效果
    const lights = document.querySelectorAll('.slot-machine-light')
    lights.forEach(light => {
      light.style.animationDuration = `${0.5 + Math.random() * 1}s`
    })

    // 确保DOM已经渲染完成
    await nextTick()

    if (namesContainer.value) {
      // 添加滚动动画类
      // namesContainer.value.style.animation = 'slotScroll 0.1s infinite linear'
      // console.log('Setting animation on namesContainer.value2:', namesContainer.value);
      // // 随机添加名字高亮效果的定时器
      // const highlightInterval = setInterval(() => {
      //   if (!isSlotRunning.value) {
      //     clearInterval(highlightInterval)
      //     return
      //   }

      //   // 随机添加名字高亮效果
      //   if (Math.random() < 0.3) {
      //     const nameElements = document.querySelectorAll('.slot-machine .name')
      //     if (nameElements.length > 0) {
      //       const randomIndex = Math.floor(Math.random() * nameElements.length)
      //       const randomName = nameElements[randomIndex]
      //       randomName.classList.add('name-highlight')
      //       setTimeout(() => {
      //         randomName.classList.remove('name-highlight')
      //       }, 500)
      //     }
      //   }
      // }, 200)
      scrollInterval.value = setInterval(() => {
        rollingOffset.value += 20; // 更快的滚动速度

        if (namesContainer.value) {
          namesContainer.value.style.transform = `translateY(-${rollingOffset.value}px)`;
          // namesWrapper.value.style.filter = 'blur(2px)'; // 添加模糊效果
        }
      }, 20);
      // 保存定时器ID以便后续清理
      // slotAnimationId.value = highlightInterval
    }
  } catch (error) {
    console.error('抽奖错误:', error)
    ElMessage.error('抽奖过程中出错')
    loadError.value = true
    setTimeout(startLottery, 3000) // 3秒后自动重试
  }
}


// 停止抽奖
const stopLottery = async () => {
  // 停止老虎机滚动动画
  if (!isSlotRunning.value) return
  // 停止之前的动画
  if (scrollInterval.value) {
    clearInterval(scrollInterval.value)
    scrollInterval.value = null
  }

  // 先获取中奖结果
  const award = awards.value.find(p => p.name === currentAward.value)
  if (!award) return
  const awards_to_draw = [award]

  try {
    // 调用后端API获取中奖者
    const response = await fetch('/api/lottery/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        awards_to_draw: awards_to_draw,
      })
    });

    if (!response.ok) throw new Error('抽奖结果获取失败')
    const resultData = await response.json()
    const { winners: drawnWinners, updated_awards } = resultData

    if (drawnWinners.length === 0) {
      isSlotRunning.value = false
      ElMessage.warning('本轮抽奖无中奖者')
      return
    }

    // 找到中奖者在参与者列表中的索引
    const winnerName = drawnWinners[0].name
    const winnerIndex = availableParticipants.value.findIndex(p => p.name === winnerName)

    if (winnerIndex === -1) {
      isSlotRunning.value = false
      ElMessage.error('中奖者不在当前参与者列表中')
      return
    }

    // 老虎机效果：先减速再停止到指定位置
    let slowDownSteps = 0;
    const maxSlowDownSteps = 15;

    const slowDownInterval = setInterval(() => {
      slowDownSteps++;
      const speed = Math.max(1, 8 - slowDownSteps * 0.5); // 逐渐减速
      rollingOffset.value += speed;

      if (namesContainer.value) {
        namesContainer.value.style.transform = `translateY(-${rollingOffset.value}px)`;
      }

      if (slowDownSteps >= maxSlowDownSteps) {
        clearInterval(slowDownInterval);
        if (namesContainer.value) {
          // 计算目标位置，确保选中的名字显示在中间
          const slotHeight = 220 // 老虎机容器高度
          const itemHeight = 180 // 每个名字的高度
          const centerOffset = (slotHeight - itemHeight) / 2 // 居中偏移量
          const targetOffset = winnerIndex * itemHeight - centerOffset

          // 平滑过渡到最终位置
          namesContainer.value.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          namesContainer.value.style.transform = `translateY(-${targetOffset}px)`

          // 播放中奖音效
          playWinnerSound()

          // 添加结果高亮效果
          setTimeout(() => {
            const nameElements = document.querySelectorAll('.slot-machine .name')
            nameElements.forEach((name, index) => {
              name.classList.remove('selected', 'winner-pulse')
              if (index === winnerIndex) {
                name.classList.add('selected')
                // 添加脉冲动画效果
                name.classList.add('winner-pulse')
              }
            })

            isSlotRunning.value = false

            // 处理抽奖结果
            handleLotteryResultWithData(drawnWinners, updated_awards)
          }, 500) // 等待滚动动画完成
        }
      }
    }, 50)

  } catch (error) {
    console.error('停止抽奖时出错:', error)
    ElMessage.error('抽奖失败，请重试')
    isSlotRunning.value = false
  }
}

// 处理已获取的抽奖结果
const handleLotteryResultWithData = async (drawnWinners, updated_awards) => {
  try {
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

    // 刷新中奖列表
    loadWinners()

    // 弹窗展示中奖人员信息（添加延迟和动画效果）
    if (drawnWinners.length > 0) {
      console.log('显示中奖弹窗', drawnWinners[0])
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

      // 延迟显示弹窗，增加戏剧效果
      setTimeout(() => {
        showWinnerDialog.value = true
      }, 800)
    }

  } catch (error) {
    console.error('处理中奖结果时出错:', error)
    ElMessage.error('处理中奖结果失败')
  }
}

// 保留原有的handleLotteryResult函数作为备用
const handleLotteryResult = async () => {
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
      })
    });

    console.log('参与者:', availableParticipants)
    if (!response.ok) throw new Error('抽奖结果获取失败')

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

    // 刷新中奖列表
    loadWinners()

    // 弹窗展示中奖人员信息
    if (drawnWinners.length > 0) {
      console.log('显示中奖弹窗', drawnWinners[0])
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
</script>

<style lang="scss" scoped>
.home-container {
  display: grid;
  // grid-template-rows: auto 1fr;
  width: 100vw;
  height: 100vh;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  position: relative;
  margin: 0;
  padding: 0;
}

.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  pointer-events: none;
  // background-size: stretch;

  .videoBg {
    position: absolute;
    object-fit: cover;
    top: 0;
    right: 0;
    width: 100vw;
    height: 100vh;
    z-index: -1;
    transition: opacity 0.3s ease;
  }
}

/* 背景视频响应式优化 */
@media (max-width: 767px) {
  .videoBg {
    opacity: 0.7;
    /* 在移动设备上降低视频透明度以提高性能 */
  }
}

@media (max-width: 479px) {
  .videoBg {
    opacity: 0.5;
    filter: blur(1px);
    /* 轻微模糊以减少移动设备负载 */
  }
}

@media (max-width: 319px) {
  .videoBg {
    opacity: 0.3;
    filter: blur(2px);
  }
}

/* 导航栏响应式设计 */
@media (max-width: 1199px) and (min-width: 768px) {
  .el-header {
    padding: 0 15px;

    .nav-container {
      .logo {
        font-size: 20px;
      }

      .nav-menu {
        :deep(.el-menu-item) {
          font-size: 0.9rem;
          height: 55px;
          line-height: 55px;
        }
      }
    }
  }
}

@media (max-width: 767px) {
  .el-header {
    padding: 0 10px;

    .nav-container {
      .logo {
        font-size: 18px;
      }

      .nav-menu {
        :deep(.el-menu-item) {
          font-size: 0.85rem;
          height: 50px;
          line-height: 50px;
          padding: 0 10px;
        }
      }
    }
  }
}

@media (max-width: 479px) {
  .el-header {
    padding: 0 8px;

    .nav-container {
      .logo {
        font-size: 16px;
      }

      .nav-menu {
        :deep(.el-menu-item) {
          font-size: 0.8rem;
          height: 45px;
          line-height: 45px;
          padding: 0 8px;
        }
      }
    }
  }
}

@media (max-width: 319px) {
  .el-header {
    padding: 0 5px;

    .nav-container {
      .logo {
        font-size: 14px;
      }

      .nav-menu {
        :deep(.el-menu-item) {
          font-size: 0.75rem;
          height: 40px;
          line-height: 40px;
          padding: 0 5px;
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
  z-index: 100;
  padding: 0 0;
  width: 100%;
  height: 100%;
  // min-height: calc(100vh - 60px);
  overflow-x: hidden;
  overflow-y: hidden;
  box-sizing: border-box;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 40px 0px 0px;
  width: 100%;
  box-sizing: border-box;
}

/* 主要内容区域响应式 */
@media (max-width: 1199px) and (min-width: 768px) {
  .content {
    margin: 40px 0;
    padding: 0 15px;
  }
}

@media (max-width: 767px) {
  .el-main {
    min-height: calc(100vh - 50px);
  }

  .content {
    margin: 30px 0;
    padding: 0 10px;
  }
}

@media (max-width: 479px) {
  .el-main {
    min-height: calc(100vh - 45px);
  }

  .content {
    margin: 20px 0;
    padding: 0 8px;
  }
}

@media (max-width: 319px) {
  .el-main {
    min-height: calc(100vh - 40px);
  }

  .content {
    margin: 15px 0;
    padding: 0 5px;
  }
}


.lottery-area {
  display: flex;
  width: 100%;
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

  .left-award {
    background-image: url("../assets/img/leftbg.png");
    background-repeat: no-repeat;
    background-size: contain;
    // background-color: rgba(255, 255, 255, 0.9);
    // height: 100%;
    width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0;

    .lottory_award_box {
      align-items: center;
      width: 100%;
      height: 200px;
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
        cursor: pointer;
        transition: transform 0.2s ease;

        &:hover {
          transform: scale(1.1);
        }

        &:active {
          transform: scale(0.95);
        }
      }

      .lottory-awardname {
        width: 30%;
        text-align: center;
      }

      .lottory-next-btn {
        width: 30px;
        height: 30px;
        background-image: url("../assets/img/nextbtn.png");
        background-size: contain;
        background-position: center;
        cursor: pointer;
        transition: transform 0.2s ease;

        &:hover {
          transform: scale(1.1);
        }

        &:active {
          transform: scale(0.95);
        }
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
        transition: transform 0.2s ease, opacity 0.2s ease;

        &:hover {
          transform: scale(1.1);
          opacity: 0.8;
        }

        &:active {
          transform: scale(0.95);
        }
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
    width: 570px;
    // height: 100%;
    background-image: url("../assets/img/rightbg.png");
    background-repeat: no-repeat;
    background-size: contain;
    // background-color: rgba(255, 255, 255, 0.9);
    // height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
  }

  // 
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
.winner-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  max-width: 100%;
  max-height: 100%;
  display: position;
  top: 10%;
  left: 5%;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-size: 50px;
  /* 添加背景遮罩动画 */
  animation: fadeIn 0.3s ease-out;
}

.winner-popup-box {
  position: relative;
  width: 1200px;
  height: 600px;
  padding: 0;
  margin: 0 0;
  color: #ffffff;
  /* 深色文字 */
  font-family: -apple-system, Microsoft YaHei, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji",
    "Segoe UI Emoji", "Segoe UI Symbol";
  text-align: center;
  background: none;
  border-style: solid;
  border-width: 2.5rem;
  /* 40px */
  border-radius: 8px;
  border-image-source: url("data:image/png;base64,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");
  border-image-slice: 40 fill;
  border-image-repeat: stretch;
  // overflow: hidden;
  box-sizing: border-box;
  user-select: none;
  transform: translateZ(0);
  --swiper-theme-color: #007aff;
  --swiper-navigation-size: 2.75rem;
  box-shadow: 0 15px 35px rgba(245, 4, 4, 0.5);
  /* 添加弹窗缩放动画 */
  animation: popupScale 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 弹窗背景淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* 弹窗从小到大缩放动画 */
@keyframes popupScale {
  0% {
    transform: scale(0.3) translateZ(0);
    opacity: 0;
  }

  50% {
    transform: scale(1.05) translateZ(0);
  }

  100% {
    transform: scale(1) translateZ(0);
    opacity: 1;
  }
}

/* 为弹窗内容添加延迟动画 */
.winner-popup-content {
  padding: 15px;
  max-height: 70vh;
  animation: contentFadeIn 0.4s ease-out 0.3s both;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.winner-popup-header {
  position: absolute;
  top: -85px;
  left: 0;
  right: 0;
  height: 3.4rem;
  z-index: 1;
  // border-style: solid;
  // border-width: 0.5rem; /* 40px */
  // border-radius: 8px;
  background-image: url("/src/assets/img/zjbg.png");
  background-position: 50% 0;
  // background-size: 100% 100%;
  border-image-slice: 20 fill;
  border-image-repeat: stretch;
  // display: flex;
  // justify-content: space-between;
  // align-items: center;
  overflow: hidden;
  box-sizing: border-box;
  // user-select: none;
  // transform: translateZ(0);
  // --swiper-theme-color: #007aff;
  // --swiper-navigation-size: 2.75rem;
}

.winner-popup-close {
  background-image: url("/src/assets/img/zuhe.png");
  background-position: -325px -75px;
  border-radius: 50%;
  color: #fff;
  // font-size: 25px;
  cursor: pointer;
  padding: 0;
  width: 60px;
  height: 60px;
  display: absolute;
  // align-items: center;
  // justify-content: center;
  --swiper-theme-color: #007aff;
  --swiper-navigation-size: 2.75rem;
  font-family: -apple-system, Microsoft YaHei, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji",
    "Segoe UI Emoji", "Segoe UI Symbol";
  text-align: center;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  user-select: none;
  position: absolute;
  z-index: 811;
  cursor: pointer;
  top: -1.875rem;
  right: -0.875rem;
  // width: 3.5rem;
  // height: 3.5rem;
  // background-position: -10.5rem -3.5rem;

  &:hover {
    opacity: 0.8;
  }
}

.winner-popup-content {
  padding: 15px;
  max-height: 70vh;

  // overflow-y: hidden;
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
      // background-color: #cf0808;
      animation: itemSlideIn 0.5s ease-out both;

      &:hover {
        border-color: var(--primary-color);
      }

      div:nth-child(1) {
        font-size: 30px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      div:nth-child(2) {
        font-size: 20px;
        color: #e79f47;
        margin-bottom: 8px;
      }

      div:nth-child(3) {
        font-size: 30px;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 4px;
        display: inline-block;
        // background-color: rgba(var(--primary-color-rgb), 0.1);
        color: var(--primary-color);
      }
    }

    .winner-popup-item:nth-child(1) {
      animation-delay: 0.4s;
    }

    .winner-popup-item:nth-child(2) {
      animation-delay: 0.5s;
    }

    .winner-popup-item:nth-child(3) {
      animation-delay: 0.6s;
    }

    .winner-popup-item:nth-child(4) {
      animation-delay: 0.7s;
    }

    .winner-popup-item:nth-child(5) {
      animation-delay: 0.8s;
    }

    .winner-popup-item:nth-child(6) {
      animation-delay: 0.9s;
    }
  }
}
@keyframes itemSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
/* 自定义滚动条样式 */
.winner-popup-content::-webkit-scrollbar {
  width: 5px;
  /* 纵向滚动条宽度 */
  // height: 10px; /* 横向滚动条高度 */
}

/* 滚动条滑块 */
.winner-popup-content::-webkit-scrollbar-thumb {
  background: #888;
  /* 滑块颜色 */
  border-radius: 8px;
  /* 滑块边角弧度 */
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

/* 老虎机滚动样式 */
.slot-machine-container {
  text-align: center;
  padding: 150px 20px;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  margin-top: 150px;
  transition: all 0.3s ease;
  // background: rgba(255, 255, 255, 0.1);
  // backdrop-filter: blur(10px);
  // border: 1px solid rgba(255, 255, 255, 0.2);
  // box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* 老虎机容器响应式优化 */
@media (max-width: 1199px) and (min-width: 768px) {
  .slot-machine-container {
    margin-top: 100px;
    padding: 75px;
    border-radius: 15px;
  }
}

@media (max-width: 767px) {
  .slot-machine-container {
    margin-top: 80px;
    padding: 20px;
    border-radius: 12px;
    max-width: 450px;
  }
}

@media (max-width: 479px) {
  .slot-machine-container {
    margin-top: 60px;
    padding: 15px;
    border-radius: 10px;
    max-width: 350px;
  }
}

@media (max-width: 319px) {
  .slot-machine-container {
    margin-top: 40px;
    padding: 12px;
    border-radius: 8px;
    max-width: 300px;
  }
}

.slot-title {
  color: #fff;
  margin-bottom: 30px;
  font-size: 2.5rem;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  background: linear-gradient(to right, #ff9966, #ff5e62);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.slot-machine {
  height: 220px;
  width: 400px;
  margin: 0 auto 40px;
  position: relative;
  overflow: hidden;
  border: 3px solid rgba(255, 215, 0, 0.4);
  border-radius: 15px;
  background: rgba(220, 29, 29, 0.4);
  box-shadow: inset 0 0 20px rgba(222, 25, 25, 0.8),
    0 0 30px rgba(255, 215, 0, 0.6);
  /* 添加金色边框闪烁效果 */
  animation: borderGlow 3s infinite alternate;
}

/* 老虎机顶部和底部的光效 */
.slot-machine-overlay {
  position: absolute;
  left: 0;
  width: 100%;
  height: 40px;
  z-index: 2;
  pointer-events: none;
}

.slot-machine-overlay-top {
  top: 0;
  background: linear-gradient(to bottom, rgba(255, 215, 0, 0.4), transparent);
}

.slot-machine-overlay-bottom {
  bottom: 0;
  background: linear-gradient(to top, rgba(255, 215, 0, 0.4), transparent);
}

/* 老虎机侧边装饰 */
.slot-machine-side {
  position: absolute;
  top: 0;
  height: 100%;
  width: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  z-index: 2;
}

.slot-machine-side-left {
  left: 0;
}

.slot-machine-side-right {
  right: 0;
}

/* 老虎机侧边灯光 */
.slot-machine-light {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 215, 0, 0.7);
  margin: 5px auto;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
  animation: lightBlink 1s infinite alternate;
}

.slot-machine-side-left .slot-machine-light:nth-child(odd),
.slot-machine-side-right .slot-machine-light:nth-child(even) {
  animation-delay: 0.5s;
}

@keyframes lightBlink {
  from {
    opacity: 0.4;
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }

  to {
    opacity: 1;
    box-shadow: 0 0 15px rgba(255, 215, 0, 1);
  }
}

/* 金色边框闪烁动画 */
@keyframes borderGlow {
  0% {
    border-color: rgba(255, 215, 0, 0.4);
    box-shadow: inset 0 0 20px rgba(222, 25, 25, 0.8),
      0 0 30px rgba(255, 215, 0, 0.4);
  }

  100% {
    border-color: rgba(255, 215, 0, 0.8);
    box-shadow: inset 0 0 20px rgba(222, 25, 25, 0.8),
      0 0 40px rgba(255, 215, 0, 0.8);
  }
}

.slot-machine::before,
.slot-machine::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 40px;
  z-index: 2;
  pointer-events: none;
}

.slot-machine::before {
  top: 0;
  background: linear-gradient(to bottom, rgb(166, 14, 14) 0%, rgba(0, 0, 0, 0) 100%);
}

.slot-machine::after {
  bottom: 0;
  background: linear-gradient(to top, rgb(166, 14, 14) 0%, rgba(0, 0, 0, 0) 100%);
}

.names-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  // height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 30px;
  box-sizing: border-box;
  overflow: hidden;
  /* 额外高度用于滚动效果 */
}

.slot-machine .name {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  background: linear-gradient(45deg, #ff9966, #ff5e62);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 名字随机高亮效果 */
.slot-machine .name-highlight {
  animation: nameHighlight 1s ease-in-out;
}

@keyframes nameHighlight {

  0%,
  100% {
    transform: scale(1);
    filter: brightness(1);
  }

  50% {
    transform: scale(1.05);
    filter: brightness(1.5);
  }
}

/* 名字闪光效果 */
.slot-machine .name::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: transparent;
  transform: rotate(45deg);
  animation: nameSweep 3s infinite linear;
  opacity: 0;
}

@keyframes nameSweep {
  0% {
    left: -50%;
    opacity: 0;
  }

  10% {
    opacity: 0.5;
  }

  20% {
    opacity: 0;
  }

  100% {
    left: 100%;
    opacity: 0;
  }
}

.slot-machine .name:nth-child(2n) {
  background: linear-gradient(45deg, #2193b0, #6dd5ed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.slot-machine .name:nth-child(3n) {
  background: linear-gradient(45deg, #834d9b, #d04ed6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.slot-machine .name:nth-child(4n) {
  background: linear-gradient(45deg, #00b09b, #96c93d);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.slot-machine .name.selected {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transform: scale(1.1);
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  position: relative;
  z-index: 5;
}

/* 选中名字的光晕效果 */
.slot-machine .name.selected::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0) 70%);
  z-index: -1;
  opacity: 0;
  animation: glowPulse 2s infinite alternate;
}

@keyframes glowPulse {
  0% {
    opacity: 0.3;
    transform: scale(1);
  }

  100% {
    opacity: 0.7;
    transform: scale(1.2);
  }
}

/* 中奖脉冲动画 */
@keyframes winnerPulse {
  0% {
    transform: scale(1.1);
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  }

  50% {
    transform: scale(1.2);
    text-shadow: 0 0 30px rgba(255, 215, 0, 1);
  }

  100% {
    transform: scale(1.1);
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  }
}

.slot-machine .name.winner-pulse {
  animation: winnerPulse 1s infinite ease-in-out;
}

.slot-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.slot-btn {
  width: 150px;
  height: 60px;
  display: flex;
  // padding: 15px 40px;
  position: relative;
  overflow: hidden;
}

// .slot-btn::before {
//   // content: '';
//   position: absolute;
//   top: -50%;
//   left: -50%;
//   width: 200%;
//   height: 200%;
//   background: rgba(255, 255, 255, 0.2);
//   transform: rotate(45deg);
//   z-index: 1;
//   transition: all 0.6s ease;
//   opacity: 0;
// }

.slot-btn-start {
  width: 150px;
  background-image: url("../assets/img/startbtn.png");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.slot-btn-stop {
  // width: 150px;
  background-image: url("../assets/img/stopbtn.png");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.slot-btn-showDialog {
  color: #fff;
  border-radius: 30px;
  // background-color: #efdb04;
  height: 40px;

  width: 100px;
  background-image: url("../assets/img/zjmd.png");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.slot-btn:hover:not(:disabled) {
  transform: translateY(-3px);
}

// .slot-btn:hover:not(:disabled)::before {
//   opacity: 1;
//   left: -100%;
// }

// .slot-btn:active:not(:disabled) {
//   transform: translateY(1px);
//   box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
// }

.slot-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 按钮脉冲效果 */
@keyframes btnPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
  }

  70% {
    box-shadow: 0 0 0 15px rgba(255, 255, 255, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

// .slot-btn-start:not(:disabled) {
//   animation: btnPulse 2s infinite;
// }

.slot-btn-stop:not(:disabled) {
  animation: none;
}

// .slot-status {
//   color: white;
//   margin-top: 20px;
//   font-size: 1.2rem;
//   height: 30px;
//   font-weight: 500;
//   text-align: center;
//   padding: 5px 15px;
//   border-radius: 20px;
//   background: rgba(0, 0, 0, 0.3);
//   box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
//   display: inline-block;
//   min-width: 200px;
//   transition: all 0.3s ease;
// }

/* 不同状态下的样式 */
// .slot-status-rolling {
//   background: rgba(0, 176, 155, 0.3);
//   box-shadow: 0 0 15px rgba(0, 176, 155, 0.5);
// }

// .slot-status-slowing {
//   background: rgba(255, 152, 0, 0.3);
//   box-shadow: 0 0 15px rgba(255, 152, 0, 0.5);
// }

// .slot-status-winner {
//   background: rgba(255, 215, 0, 0.3);
//   box-shadow: 0 0 20px rgba(255, 215, 0, 0.7);
//   font-weight: bold;
//   color: #FFD700;
//   animation: statusGlow 2s infinite alternate;
// }

@keyframes statusGlow {
  from {
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }

  to {
    text-shadow: 0 0 15px rgba(255, 215, 0, 1);
  }
}

/* 滚动动画 */
@keyframes slotScroll {
  0% {
    transform: translateY(0);
  }

  100% {
    /* 滚动一个名字的高度，形成连续滚动效果 */
    transform: translateY(-120px);
  }
}

/* 确保名字容器可以正确滚动 */
.names-container {

  /* 为了实现无限滚动，需要复制内容 */
  &::after {
    content: '';
    display: block;
    height: 120px;
    /* 一个名字的高度 */
  }
}

/* 响应式设计 */

/* 大屏幕 (1200px+) */
@media (min-width: 1200px) {
  .el-header {
    padding: 0 40px;
  }

  .slot-machine-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .slot-title {
    font-size: 4rem;
  }
}

/* 中等屏幕 (768px - 1199px) */
@media (max-width: 1199px) and (min-width: 768px) {
  .el-header {
    padding: 0 30px;

    .nav-container {
      .logo {
        font-size: 20px;
      }

      .nav-menu :deep(.el-menu-item) {
        font-size: 0.9rem;
        height: 50px;
        line-height: 50px;
      }
    }
  }

  .slot-machine-container {
    width: 90%;
    padding: 30px 20px;
  }

  .slot-title {
    font-size: 3.5rem;
    margin-bottom: 30px;
  }

  .slot-machine {
    width: 350px;
    height: 280px;
  }

  .slot-machine .name {
    height: 120px;
    font-size: 3rem;
  }

  .slot-btn {
    padding: 15px 35px;
    font-size: 1.1rem;
    margin: 0 10px;
  }

  .winner-popup-box {
    width: 90%;
    height: 70%;
    max-width: 900px;
  }
}

/* 小屏幕平板 (600px - 767px) */
@media (max-width: 767px) and (min-width: 600px) {
  .el-header {
    padding: 0 20px;
    height: 50px;

    .nav-container {
      .logo {
        font-size: 18px;
      }

      .nav-menu {
        display: none;
      }

      .nav-dropdown {
        .el-dropdown-link {
          width: 32px;
          height: 32px;

          .el-icon {
            font-size: 16px;
          }
        }
      }
    }
  }

  .slot-machine-container {
    width: 95%;
    padding: 25px 15px;
  }

  .slot-title {
    font-size: 2.8rem;
    margin-bottom: 25px;
  }

  .slot-machine {
    width: 300px;
    height: 240px;
  }

  .slot-machine .name {
    height: 100px;
    font-size: 2.5rem;
  }

  .slot-btn {
    padding: 12px 25px;
    font-size: 1rem;
    margin: 0 8px;
  }

  .winner-popup-box {
    width: 95%;
    height: 80%;
    max-width: 600px;
  }
}

/* 手机屏幕 (480px - 599px) */
@media (max-width: 599px) and (min-width: 480px) {
  .el-header {
    padding: 0 15px;
    height: 50px;

    .nav-container {
      .logo {
        font-size: 16px;
      }

      .nav-menu {
        display: none;
      }

      .nav-dropdown {
        .el-dropdown-link {
          width: 30px;
          height: 30px;

          .el-icon {
            font-size: 14px;
          }
        }
      }
    }
  }

  .slot-machine-container {
    width: 95%;
    padding: 20px 10px;
  }

  .slot-title {
    font-size: 2.2rem;
    margin-bottom: 20px;
  }

  .slot-machine {
    width: 280px;
    height: 200px;
  }

  .slot-machine .name {
    height: 80px;
    font-size: 2rem;
    padding: 0 10px;
  }

  .slot-btn {
    padding: 10px 20px;
    font-size: 0.9rem;
    margin: 0 5px;
  }

  .winner-popup-box {
    width: 95%;
    height: 85%;
    max-width: 450px;
    border-width: 1.5rem;
  }
}

/* 小手机屏幕 (320px - 479px) */
@media (max-width: 479px) {
  .el-header {
    padding: 0 10px;
    height: 45px;

    .nav-container {
      .logo {
        font-size: 14px;
      }

      .nav-menu {
        display: none;
      }

      .nav-dropdown {
        .el-dropdown-link {
          width: 28px;
          height: 28px;

          .el-icon {
            font-size: 12px;
          }
        }
      }
    }
  }

  .slot-machine-container {
    width: 98%;
    padding: 15px 8px;
  }

  .slot-title {
    font-size: 1.8rem;
    margin-bottom: 15px;
  }

  .slot-machine {
    width: 250px;
    height: 180px;
  }

  .slot-machine .name {
    height: 70px;
    font-size: 1.6rem;
    padding: 0 8px;
  }

  .slot-btn {
    padding: 8px 15px;
    font-size: 0.8rem;
    margin: 0 3px;
  }

  .winner-popup-box {
    width: 98%;
    height: 90%;
    max-width: 320px;
    border-width: 1rem;
  }

  .winner-popup-header {
    top: -50px;
    height: 2.5rem;
  }

  .winner-popup-close {
    width: 40px;
    height: 40px;
  }
}

/* 超小屏幕 (最大319px) */
@media (max-width: 319px) {
  .el-header {
    padding: 0 8px;
    height: 40px;

    .nav-container {
      .logo {
        font-size: 12px;
      }

      .nav-menu {
        display: none;
      }

      .nav-dropdown {
        .el-dropdown-link {
          width: 24px;
          height: 24px;

          .el-icon {
            font-size: 10px;
          }
        }
      }
    }
  }

  .slot-machine-container {
    width: 100%;
    padding: 10px 5px;
  }

  .slot-title {
    font-size: 1.5rem;
    margin-bottom: 10px;
  }

  .slot-machine {
    width: 220px;
    height: 160px;
  }

  .slot-machine .name {
    height: 60px;
    font-size: 1.4rem;
    padding: 0 5px;
  }

  .slot-btn {
    padding: 6px 12px;
    font-size: 0.7rem;
    margin: 0 2px;
  }

  .winner-popup-box {
    width: 100%;
    height: 95%;
    max-width: 280px;
    border-width: 0.5rem;
  }

  .winner-popup-header {
    top: -30px;
    height: 2rem;
  }

  .winner-popup-close {
    width: 30px;
    height: 30px;
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

/* 底部导航栏样式已移至BottomNavigation组件 */
</style>