<!-- <template>
  <div class="lottery-container">
    <el-container>
      <el-header>
        <div class="header-content">
          <h2>当前奖项：{{ currentPrize.name }}</h2>
          <p>剩余数量：{{ currentPrize.remaining }}/{{ currentPrize.total }}</p>
          <el-button 
            type="primary" 
            size="large" 
            @click="startLottery" 
            :disabled="isRolling || !canStart"
          >
            {{ isRolling ? '抽奖中...' : '开始抽奖' }}
          </el-button>
        </div>
      </el-header>

      <el-main>
        <el-row :gutter="20">
          <el-col :span="16">
            <div class="name-list-container">
              <div 
                class="name-list" 
                :class="{ rolling: isRolling }"
                :style="{ animationDuration: rollDuration + 's' }"
              >
                <div 
                  v-for="(name, index) in displayNames" 
                  :key="index"
                  class="name-item"
                >
                  {{ name }}
                </div>
              </div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="winner-list">
              <h3>中奖名单</h3>
              <el-scrollbar height="400px">
                <div 
                  v-for="(winner, index) in winners" 
                  :key="index"
                  class="winner-item"
                >
                  <span class="winner-name">{{ winner.name }}</span>
                  <span class="winner-department">{{ winner.department }}</span>
                </div>
              </el-scrollbar>
            </div>
          </el-col>
        </el-row>
      </el-main>

      <el-footer>
        <div class="footer-actions">
          <el-button type="danger" @click="resetLottery">重置本轮</el-button>
          <el-button type="warning" @click="clearAll">清空所有</el-button>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePrizeStore } from '@/stores/prize'
import { useParticipantStore } from '@/stores/participant'

const prizeStore = usePrizeStore()
const participantStore = useParticipantStore()

const isRolling = ref(false)
const rollDuration = ref(3)
const winners = ref([])

const currentPrize = computed(() => prizeStore.currentPrize)
const displayNames = computed(() => participantStore.displayNames)
const canStart = computed(() => {
  return currentPrize.value.remaining > 0 && 
         participantStore.availableParticipants.length > 0
})

const startLottery = async () => {
  if (!canStart.value) return
  
  isRolling.value = true
  await new Promise(resolve => setTimeout(resolve, rollDuration.value * 1000))
  
  const winner = participantStore.drawWinner(currentPrize.value)
  if (winner) {
    winners.value.unshift(winner)
    prizeStore.decreaseRemaining()
  }
  
  isRolling.value = false
}

const resetLottery = () => {
  winners.value = []
  prizeStore.resetCurrentPrize()
}

const clearAll = () => {
  if (confirm('确定要清空所有中奖记录吗？')) {
    winners.value = []
    prizeStore.resetAllPrizes()
    participantStore.resetAllParticipants()
  }
}
</script>

<style lang="scss" scoped>
.lottery-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff4d4d 0%, #ff8c8c 100%);
  color: white;
  padding: 20px;

  .el-header {
    text-align: center;
    padding: 20px 0;

    .header-content {
      h2 {
        font-size: 2rem;
        margin-bottom: 10px;
      }

      p {
        font-size: 1.2rem;
        margin-bottom: 20px;
      }
    }
  }

  .name-list-container {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 10px;
    padding: 20px;
    height: 500px;
    overflow: hidden;
    position: relative;

    .name-list {
      &.rolling {
        animation: roll linear infinite;
      }
    }

    .name-item {
      padding: 15px;
      text-align: center;
      font-size: 1.5rem;
      color: var(--primary-color);
      border-bottom: 1px solid #eee;
    }
  }

  .winner-list {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 10px;
    padding: 20px;
    height: 500px;

    h3 {
      color: var(--primary-color);
      text-align: center;
      margin-bottom: 20px;
    }

    .winner-item {
      padding: 10px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .winner-name {
        font-weight: bold;
        color: var(--primary-color);
      }

      .winner-department {
        color: #666;
      }
    }
  }

  .el-footer {
    text-align: center;
    padding: 20px 0;

    .footer-actions {
      display: flex;
      justify-content: center;
      gap: 20px;
    }
  }
}

@keyframes roll {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-100%);
  }
}
</style>  -->