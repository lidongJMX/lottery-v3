<template>
  <div class="lottery-container" :class="{ 'rolling': isRolling }">
    <!-- 背景粒子效果 -->
    <div class="particles-bg">
      <div 
        v-for="n in 50" 
        :key="n" 
        class="particle"
        :style="getParticleStyle(n)"
      ></div>
    </div>

    <!-- 主抽奖区域 -->
    <div class="lottery-main">
      <!-- 标题区域 -->
      <div class="lottery-header">
        <h2 class="lottery-title">{{ title }}</h2>
        <div class="lottery-subtitle">{{ subtitle }}</div>
      </div>

      <!-- 滚动显示区域 -->
      <div class="roll-display-area">
        <!-- 装饰边框 -->
        <div class="display-border">
          <div class="border-corner top-left"></div>
          <div class="border-corner top-right"></div>
          <div class="border-corner bottom-left"></div>
          <div class="border-corner bottom-right"></div>
        </div>

        <!-- 滚动容器 -->
        <div class="roll-container" ref="rollContainer">
          <div 
            class="roll-track" 
            :style="rollTrackStyle"
            ref="rollTrack"
          >
            <div 
              v-for="(name, index) in displayNames" 
              :key="`${name}-${index}`"
              class="name-item"
              :class="{ 
                'highlight': index === highlightIndex,
                'winner': isWinner(name, index)
              }"
            >
              <div class="name-text">{{ name }}</div>
              <div class="name-glow"></div>
            </div>
          </div>
        </div>

        <!-- 中央指示器 -->
        <div class="center-indicator">
          <div class="indicator-arrow"></div>
          <div class="indicator-glow"></div>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="control-buttons">
        <button 
          class="lottery-btn start-btn"
          @click="startRoll"
          :disabled="isRolling"
        >
          <span class="btn-text">{{ isRolling ? '抽奖中...' : '开始抽奖' }}</span>
          <div class="btn-ripple"></div>
        </button>
        
        <button 
          class="lottery-btn reset-btn"
          @click="resetRoll"
          :disabled="isRolling"
        >
          <span class="btn-text">重置</span>
        </button>
      </div>

      <!-- 结果显示 -->
      <div class="result-display" v-if="winner">
        <div class="result-container">
          <div class="result-title">🎉 恭喜中奖 🎉</div>
          <div class="winner-name">{{ winner }}</div>
          <div class="celebration-effects">
            <div v-for="n in 20" :key="n" class="confetti" :style="getConfettiStyle(n)"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置面板 -->
    <div class="settings-panel" v-if="showSettings">
      <div class="settings-content">
        <h3>抽奖设置</h3>
        
        <div class="setting-item">
          <label>滚动速度</label>
          <input v-model="settings.speed" type="range" min="1" max="10" />
        </div>
        
        <div class="setting-item">
          <label>持续时间</label>
          <input v-model="settings.duration" type="range" min="2" max="10" />
        </div>
        
        <div class="setting-item">
          <label>动画模式</label>
          <select v-model="settings.mode">
            <option value="vertical">垂直滚动</option>
            <option value="horizontal">水平滚动</option>
            <option value="3d">3D旋转</option>
          </select>
        </div>
        
        <div class="setting-item">
          <label>主题</label>
          <select v-model="settings.theme">
            <option value="classic">经典</option>
            <option value="neon">霓虹</option>
            <option value="elegant">优雅</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 设置按钮 -->
    <button class="settings-toggle" @click="showSettings = !showSettings">
      ⚙️
    </button>
  </div>
</template>

<script>
export default {
  name: 'AdvancedLotteryRoll',
  props: {
    participants: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: '幸运抽奖'
    },
    subtitle: {
      type: String,
      default: '祝您好运！'
    }
  },
  data() {
    return {
      isRolling: false,
      winner: null,
      displayNames: [],
      highlightIndex: 0,
      rollOffset: 0,
      animationId: null,
      showSettings: false,
      settings: {
        speed: 5,
        duration: 5,
        mode: 'vertical',
        theme: 'classic'
      },
      rollStartTime: 0,
      rollDuration: 5000,
      finalWinnerIndex: 0
    }
  },
  computed: {
    rollTrackStyle() {
      if (this.settings.mode === 'vertical') {
        return {
          transform: `translateY(${this.rollOffset}px)`,
          transition: this.isRolling ? 'none' : 'transform 0.5s ease-out'
        }
      } else if (this.settings.mode === 'horizontal') {
        return {
          transform: `translateX(${this.rollOffset}px)`,
          transition: this.isRolling ? 'none' : 'transform 0.5s ease-out'
        }
      } else {
        return {
          transform: `rotateX(${this.rollOffset}deg)`,
          transition: this.isRolling ? 'none' : 'transform 0.5s ease-out'
        }
      }
    }
  },
  mounted() {
    this.initializeDisplay()
  },
  methods: {
    initializeDisplay() {
      // 创建显示用的名单，包含重复项以实现无缝滚动
      const names = this.participants.map(p => p.name || p)
      this.displayNames = [...names, ...names, ...names, ...names]
      this.highlightIndex = Math.floor(this.displayNames.length / 2)
    },

    startRoll() {
      if (this.isRolling || this.participants.length === 0) return
      
      this.isRolling = true
      this.winner = null
      this.rollStartTime = Date.now()
      this.rollDuration = this.settings.duration * 1000
      
      // 随机选择最终获奖者
      this.finalWinnerIndex = Math.floor(Math.random() * this.participants.length)
      
      // 播放开始音效
      this.playSound('start')
      
      // 开始动画
      this.animate()
    },

    animate() {
      const now = Date.now()
      const elapsed = now - this.rollStartTime
      const progress = Math.min(elapsed / this.rollDuration, 1)
      
      // 使用缓动函数实现渐进式减速
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      if (this.settings.mode === 'vertical') {
        // 垂直滚动
        const itemHeight = 80
        const maxOffset = this.displayNames.length * itemHeight
        const targetOffset = this.finalWinnerIndex * itemHeight + maxOffset * 2
        this.rollOffset = -easeOut * targetOffset
        
        // 更新高亮索引
        const currentIndex = Math.floor(Math.abs(this.rollOffset) / itemHeight) % this.displayNames.length
        this.highlightIndex = currentIndex
        
      } else if (this.settings.mode === 'horizontal') {
        // 水平滚动
        const itemWidth = 200
        const maxOffset = this.displayNames.length * itemWidth
        const targetOffset = this.finalWinnerIndex * itemWidth + maxOffset * 2
        this.rollOffset = -easeOut * targetOffset
        
      } else {
        // 3D旋转
        const degreesPerItem = 360 / this.participants.length
        const targetRotation = this.finalWinnerIndex * degreesPerItem + 360 * 5
        this.rollOffset = easeOut * targetRotation
      }
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(() => this.animate())
      } else {
        this.finishRoll()
      }
    },

    finishRoll() {
      this.isRolling = false
      this.winner = this.participants[this.finalWinnerIndex].name || this.participants[this.finalWinnerIndex]
      
      // 播放中奖音效
      this.playSound('win')
      
      // 触发庆祝动画
      this.triggerCelebration()
      
      // 发送中奖事件
      this.$emit('winner-selected', {
        winner: this.winner,
        index: this.finalWinnerIndex,
        participant: this.participants[this.finalWinnerIndex]
      })
    },

    resetRoll() {
      if (this.isRolling) return
      
      this.winner = null
      this.rollOffset = 0
      this.highlightIndex = Math.floor(this.displayNames.length / 2)
      
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }
    },

    isWinner(name, index) {
      return this.winner && name === this.winner && !this.isRolling
    },

    getParticleStyle(index) {
      const angle = (index / 50) * 360
      const radius = 100 + Math.random() * 200
      const x = Math.cos(angle * Math.PI / 180) * radius
      const y = Math.sin(angle * Math.PI / 180) * radius
      
      return {
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${2 + Math.random() * 3}s`
      }
    },

    getConfettiStyle(index) {
      return {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
      }
    },

    triggerCelebration() {
      // 添加庆祝特效
      setTimeout(() => {
        this.createFireworks()
      }, 500)
    },

    createFireworks() {
      // 创建烟花效果
      const container = this.$refs.rollContainer
      if (!container) return
      
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          const firework = document.createElement('div')
          firework.className = 'firework'
          firework.style.left = `${Math.random() * 100}%`
          firework.style.top = `${Math.random() * 100}%`
          container.appendChild(firework)
          
          setTimeout(() => {
            if (firework.parentNode) {
              firework.parentNode.removeChild(firework)
            }
          }, 1000)
        }, i * 200)
      }
    },

    playSound(type) {
      // 音效播放（需要音频文件）
      try {
        const audio = new Audio(`/sounds/${type}.mp3`)
        audio.volume = 0.3
        audio.play().catch(() => {
          // 忽略音频播放错误
        })
      } catch (error) {
        // 忽略音频相关错误
      }
    }
  },

  beforeUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }
}
</script>

<style scoped>
.lottery-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  overflow: hidden;
}

.particles-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255,255,255,0.6);
  border-radius: 50%;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) scale(1); opacity: 0.6; }
  50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
}

.lottery-main {
  position: relative;
  z-index: 2;
}

.lottery-header {
  text-align: center;
  margin-bottom: 30px;
}

.lottery-title {
  font-size: 2.5em;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  margin: 0;
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lottery-subtitle {
  font-size: 1.2em;
  color: rgba(255,255,255,0.9);
  margin-top: 10px;
}

.roll-display-area {
  position: relative;
  height: 400px;
  margin: 30px 0;
  background: rgba(0,0,0,0.3);
  border-radius: 15px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.display-border {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

.border-corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border: 3px solid #ffd700;
}

.border-corner.top-left {
  top: 10px;
  left: 10px;
  border-right: none;
  border-bottom: none;
}

.border-corner.top-right {
  top: 10px;
  right: 10px;
  border-left: none;
  border-bottom: none;
}

.border-corner.bottom-left {
  bottom: 10px;
  left: 10px;
  border-right: none;
  border-top: none;
}

.border-corner.bottom-right {
  bottom: 10px;
  right: 10px;
  border-left: none;
  border-top: none;
}

.roll-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.roll-track {
  position: relative;
  width: 100%;
}

.name-item {
  position: relative;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  transition: all 0.3s ease;
}

.name-item.highlight {
  background: rgba(255,215,0,0.2);
  transform: scale(1.05);
}

.name-item.winner {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  color: #333;
  font-weight: bold;
  animation: winner-glow 1s ease-in-out infinite alternate;
}

@keyframes winner-glow {
  from { box-shadow: 0 0 20px rgba(255,215,0,0.5); }
  to { box-shadow: 0 0 40px rgba(255,215,0,0.8); }
}

.name-text {
  font-size: 1.5em;
  font-weight: 600;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  z-index: 2;
}

.name-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.name-item:hover .name-glow {
  opacity: 1;
}

.center-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
  pointer-events: none;
}

.indicator-arrow {
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 30px solid #ffd700;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.indicator-glow {
  position: absolute;
  top: -15px;
  left: -25px;
  width: 50px;
  height: 50px;
  background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: indicator-pulse 2s ease-in-out infinite;
}

@keyframes indicator-pulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
}

.control-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 30px 0;
}

.lottery-btn {
  position: relative;
  padding: 15px 30px;
  font-size: 1.2em;
  font-weight: bold;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.start-btn {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
  color: white;
  box-shadow: 0 8px 20px rgba(255,107,107,0.3);
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(255,107,107,0.4);
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.reset-btn {
  background: linear-gradient(45deg, #74b9ff, #0984e3);
  color: white;
  box-shadow: 0 8px 20px rgba(116,185,255,0.3);
}

.reset-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(116,185,255,0.4);
}

.btn-text {
  position: relative;
  z-index: 2;
}

.btn-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255,255,255,0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.lottery-btn:active .btn-ripple {
  width: 300px;
  height: 300px;
}

.result-display {
  text-align: center;
  margin-top: 30px;
}

.result-container {
  position: relative;
  background: rgba(255,255,255,0.1);
  border-radius: 15px;
  padding: 30px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255,215,0,0.5);
}

.result-title {
  font-size: 1.5em;
  color: #ffd700;
  margin-bottom: 15px;
  animation: result-bounce 0.6s ease-out;
}

.winner-name {
  font-size: 2.5em;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  animation: winner-appear 0.8s ease-out 0.3s both;
}

@keyframes result-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes winner-appear {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.celebration-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #ffd700;
  animation: confetti-fall 3s linear infinite;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-100px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(400px) rotate(360deg);
    opacity: 0;
  }
}

.settings-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 250px;
  background: rgba(0,0,0,0.8);
  border-radius: 10px;
  padding: 20px;
  backdrop-filter: blur(10px);
  z-index: 10;
}

.settings-content h3 {
  color: white;
  margin: 0 0 20px 0;
  text-align: center;
}

.setting-item {
  margin-bottom: 15px;
}

.setting-item label {
  display: block;
  color: white;
  margin-bottom: 5px;
  font-size: 0.9em;
}

.setting-item input,
.setting-item select {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 5px;
  background: rgba(255,255,255,0.1);
  color: white;
}

.setting-item input[type="range"] {
  background: transparent;
}

.settings-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  color: white;
  font-size: 1.5em;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  z-index: 11;
}

.settings-toggle:hover {
  background: rgba(0,0,0,0.7);
  transform: rotate(90deg);
}

.firework {
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, #ffd700 0%, #ff6b6b 50%, #74b9ff 100%);
  border-radius: 50%;
  animation: firework-explode 1s ease-out;
}

@keyframes firework-explode {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(3);
    opacity: 0.8;
  }
  100% {
    transform: scale(6);
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .lottery-container {
    padding: 15px;
  }
  
  .lottery-title {
    font-size: 2em;
  }
  
  .roll-display-area {
    height: 300px;
  }
  
  .name-item {
    height: 60px;
  }
  
  .name-text {
    font-size: 1.2em;
  }
  
  .control-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .lottery-btn {
    width: 200px;
  }
  
  .settings-panel {
    width: 200px;
    right: 10px;
  }
}

/* 主题变体 */
.lottery-container.theme-neon {
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
  border: 2px solid #00ffff;
  box-shadow: 0 0 30px rgba(0,255,255,0.3);
}

.lottery-container.theme-elegant {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  border: 2px solid #ecf0f1;
}
</style>