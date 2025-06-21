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
          <div class="content-awardlist">
            <div class="awardbox">
              <div class="prizeimg">
                <img src="../assets/img/awardbg.png">
              </div>
            </div>
          </div>
          <div class="content-luckbox">
            <div class="luckerbox-content">
              <ul class="luckerbox-lists"></ul>
              <!-- <div class="importcj-btip hidden">尽显公平与公正</div> -->
            </div>
          </div>
        </div>
        <el-footer class="lottery-footer">
          <div class="lottory_number">
            <div class="lottory-prev-btn" @click="prevAward" title="上一个奖项"></div>
            <div class="active-awardname limitbox">{{ currentAwardName }}</div>
            <div class="lottory-next-btn" @click="nextAward" title="下一个奖项"></div>
          </div>
          <div class="lottory-selectbox">
            <img id="prize_decrement" src="/src/assets/img/reduce.png" @click="decrementDrawCount" title="减少抽取人数">
            <input class="numbernum" :value="currentDrawCount" readonly>
            <img id="prize_increment" src="/src/assets/img/add.png" @click="incrementDrawCount" title="增加抽取人数">
          </div>
          <div class="lottory-selectbtn">
            <el-button type="primary" @click="startLottery">开始抽奖</el-button>
          </div>
          <div class="lottory-selectDialog" @click="showWinnerDialog = true" :disabled="isSlotRunning"></div>
        </el-footer>
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

onMounted(() => {
  loadawards()
  loadWinners()
  loadParticipants()
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
</script>
