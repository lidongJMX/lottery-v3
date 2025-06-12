<template>
  <div class="settings-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- 基础设置 -->
        <el-tab-pane label="基础设置" name="basic">
          <div class="settings-section">
            <h3>会议主题设置</h3>
            <p class="section-desc">设置会议或活动的主题名称</p>
            
            <el-form>
              <el-form-item label="会议主题">
                <el-input
                  v-model="meetingTheme"
                  placeholder="请输入会议主题"
                  maxlength="50"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveMeetingTheme">保存主题设置</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="settings-section">
            <h3>主页背景音乐设置</h3>
            <p class="section-desc">设置主页播放的背景音乐</p>
            
            <el-form>
              <el-form-item label="背景音乐开关">
                <el-switch
                  v-model="backgroundMusicEnabled"
                  @change="toggleBackgroundMusic"
                  active-text="开启"
                  inactive-text="关闭"
                />
              </el-form-item>
              <el-form-item label="音乐文件" v-if="backgroundMusicEnabled">
                <el-upload
                  class="music-upload"
                  :action="uploadUrl"
                  :before-upload="beforeMusicUpload"
                  :on-success="handleMusicUploadSuccess"
                  :file-list="musicFileList"
                  accept=".mp3,.wav,.ogg"
                  :limit="1"
                >
                  <el-button type="primary">选择音乐文件</el-button>
                  <template #tip>
                    <div class="el-upload__tip">
                      支持 mp3/wav/ogg 格式，文件大小不超过 10MB
                    </div>
                  </template>
                </el-upload>
              </el-form-item>
              <el-form-item label="音量控制" v-if="backgroundMusicEnabled && currentMusicUrl">
                <el-slider
                  v-model="musicVolume"
                  :min="0"
                  :max="100"
                  @change="updateMusicVolume"
                  show-input
                  input-size="small"
                  style="width: 300px;"
                />
              </el-form-item>
              <el-form-item v-if="currentMusicUrl">
                <el-button @click="testPlayMusic" :disabled="!backgroundMusicEnabled">
                  {{ isPlaying ? '停止试听' : '试听音乐' }}
                </el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <div class="settings-section">
            <h3>轮次抽奖开关设置</h3>
            <p class="section-desc">控制是否启用轮次抽奖功能</p>
            
            <el-form>
              <el-form-item label="轮次抽奖功能">
                <el-switch
                  v-model="roundLotteryEnabled"
                  @change="toggleRoundLottery"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
              <el-form-item>
                <div class="setting-desc">
                  <p v-if="roundLotteryEnabled" class="enabled-desc">
                    ✅ 轮次抽奖功能已启用，用户可以进行轮次抽奖
                  </p>
                  <p v-else class="disabled-desc">
                    ❌ 轮次抽奖功能已禁用，用户无法进行轮次抽奖
                  </p>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 背景设置 -->
        <el-tab-pane label="背景设置" name="background">
          <div class="settings-section">
            <h3>背景图片设置</h3>
            <p class="section-desc">选择抽奖页面的背景图片</p>
            
            <div class="background-selector">
              <div
                v-for="(bg, index) in backgroundOptions"
                :key="index"
                class="background-option"
                :class="{ active: currentBackground === bg.url }"
                @click="selectBackground(bg.url)"
              >
                <img :src="bg.url" :alt="bg.name" />
                <div class="bg-name">{{ bg.name }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 时间设置 -->
        <el-tab-pane label="时间设置" name="time">
          <div class="settings-section">
            <h3>抽奖时间设置</h3>
            <p class="section-desc">设置抽奖开始时间，用于首页倒计时显示</p>
            
            <el-form>
              <el-form-item label="抽奖开始时间">
                <el-date-picker
                  v-model="lotteryDateTime"
                  type="datetime"
                  placeholder="选择日期时间"
                  format="YYYY-MM-DD HH:mm:ss"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveLotteryDateTime">保存时间设置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <!-- 数据管理 -->
        <el-tab-pane label="数据管理" name="data">
          <div class="settings-section">
            <h3>数据重置与清空</h3>
            <p class="section-desc">管理抽奖系统的数据，包括重置中奖数据和清空所有数据</p>
            
            <div class="data-actions">
              <el-card class="action-card">
                <template #header>
                  <div class="action-header">
                    <span>重置中奖数据</span>
                  </div>
                </template>
                <div class="action-content">
                  <p>此操作将清空所有中奖记录，恢复所有参与者状态，并重置奖项剩余数量。</p>
                  <el-button type="warning" @click="resetLotteryData">重置中奖数据</el-button>
                </div>
              </el-card>
              
              <el-card class="action-card">
                <template #header>
                  <div class="action-header">
                    <span>清空所有数据</span>
                  </div>
                </template>
                <div class="action-content">
                  <p>此操作将清空所有参与者列表、中奖记录，并重置奖项和轮次数据。此操作不可恢复！</p>
                  <el-button type="danger" @click="clearAllData">清空所有数据</el-button>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 系统信息 -->
        <el-tab-pane label="系统信息" name="info">
          <div class="settings-section">
            <h3>系统信息</h3>
            <p class="section-desc">查看系统版本和相关信息</p>
            
            <el-descriptions :column="1" border>
              <el-descriptions-item label="系统名称">年会抽奖系统</el-descriptions-item>
              <el-descriptions-item label="系统版本">v3.0.0</el-descriptions-item>
              <el-descriptions-item label="前端框架">Vue 3 + Vite + Element Plus</el-descriptions-item>
              <el-descriptions-item label="后端框架">Express + MongoDB</el-descriptions-item>
              <el-descriptions-item label="开发者">抽奖系统开发团队</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 当前激活的标签页
const activeTab = ref('basic')

// 基础设置
const meetingTheme = ref('')
const backgroundMusicEnabled = ref(false)
const currentMusicUrl = ref('')
const musicFileList = ref([])
const musicVolume = ref(50)
const isPlaying = ref(false)
const audioElement = ref(null)
const roundLotteryEnabled = ref(true)
const uploadUrl = '/api/upload/music'

// 背景设置
const currentBackground = ref('')
const backgroundOptions = [
  { name: '背景1', url: '/src/assets/background.png' },
  { name: '背景2', url: '/src/assets/background-2.png' },
  { name: '背景3', url: '/src/assets/backgroud-3.png' },
  { name: '背景4', url: '/src/assets/background-4.png' },
  { name: '背景5', url: '/src/assets/background-5.png' }
]

// 时间设置
const lotteryDateTime = ref(new Date())

// 初始化
onMounted(() => {
  loadBasicSettings()
  loadCurrentBackground()
  loadLotteryDateTime()
  initAudioElement()
})

// 选择背景
const selectBackground = (url) => {
  currentBackground.value = url
  localStorage.setItem('background', url)
  ElMessage.success('背景已更新')
}

// 加载当前背景
const loadCurrentBackground = () => {
  const savedBackground = localStorage.getItem('background')
  if (savedBackground) {
    currentBackground.value = savedBackground
  } else {
    // 默认背景
    currentBackground.value = backgroundOptions[0].url
  }
}

// 保存抽奖时间
const saveLotteryDateTime = () => {
  localStorage.setItem('lotteryDateTime', lotteryDateTime.value.getTime())
  ElMessage.success('抽奖时间已设置')
}

// 加载抽奖时间
const loadLotteryDateTime = () => {
  const savedDateTime = localStorage.getItem('lotteryDateTime')
  if (savedDateTime) {
    lotteryDateTime.value = new Date(parseInt(savedDateTime))
  }
}

// 重置抽奖数据
const resetLotteryData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有中奖数据吗？此操作将清空所有中奖记录，恢复所有参与者状态，并重置奖项剩余数量。',
      '重置确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const response = await fetch('/api/lottery/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) throw new Error('重置失败')

    const result = await response.json()
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
    await ElMessageBox.confirm(
      '确定要清空所有数据吗？此操作将清空所有参与者列表、中奖记录，并重置奖项和轮次数据。此操作不可恢复！',
      '清空确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger',
      }
    )

    const response = await fetch('/api/lottery/clearAllData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) throw new Error('清空失败')

    const result = await response.json()
    ElMessage.success('所有数据已清空')
  } catch (error) {
    if (error === 'cancel') return
    console.error('清空数据失败:', error)
    ElMessage.error('清空失败，请稍后重试')
  }
}

// 基础设置相关方法
// 加载基础设置
const loadBasicSettings = async () => {
  try {
    // 从数据库加载设置
    const response = await request.get('/api/settings')
    if (response.data.success) {
      const data = response.data.data
      
      // 更新设置数据
      meetingTheme.value = data.meetingTheme || '年会抽奖系统'
      backgroundMusicEnabled.value = data.backgroundMusicEnabled || false
      currentMusicUrl.value = data.currentMusicUrl || ''
      musicVolume.value = data.musicVolume !== undefined ? data.musicVolume : 50
      roundLotteryEnabled.value = data.roundLotteryEnabled !== undefined ? data.roundLotteryEnabled : true
      
      // 同步到localStorage
      localStorage.setItem('meetingTheme', meetingTheme.value)
      localStorage.setItem('backgroundMusicEnabled', backgroundMusicEnabled.value.toString())
      localStorage.setItem('currentMusicUrl', currentMusicUrl.value)
      localStorage.setItem('musicVolume', musicVolume.value.toString())
      localStorage.setItem('roundLotteryEnabled', roundLotteryEnabled.value.toString())
      
      // 更新音乐文件列表
      if (currentMusicUrl.value) {
        musicFileList.value = [{
          name: '背景音乐.mp3',
          url: currentMusicUrl.value
        }]
      }
    } else {
      // 如果数据库中没有设置，则从localStorage加载
      loadFromLocalStorage()
    }
  } catch (error) {
    console.error('从数据库加载设置失败:', error)
    // 如果API调用失败，则从localStorage加载
    loadFromLocalStorage()
  }
}

// 从localStorage加载设置（备用方案）
const loadFromLocalStorage = () => {
  // 加载会议主题
  const savedTheme = localStorage.getItem('meetingTheme')
  if (savedTheme) {
    meetingTheme.value = savedTheme
  }
  
  // 加载背景音乐设置
  const musicEnabled = localStorage.getItem('backgroundMusicEnabled')
  backgroundMusicEnabled.value = musicEnabled === 'true'
  
  const savedMusicUrl = localStorage.getItem('currentMusicUrl')
  if (savedMusicUrl) {
    currentMusicUrl.value = savedMusicUrl
    musicFileList.value = [{
      name: '背景音乐.mp3',
      url: savedMusicUrl
    }]
  }
  
  const savedVolume = localStorage.getItem('musicVolume')
  if (savedVolume) {
    musicVolume.value = parseInt(savedVolume)
  }
  
  // 加载轮次抽奖开关
  const roundLotteryStatus = localStorage.getItem('roundLotteryEnabled')
  roundLotteryEnabled.value = roundLotteryStatus !== 'false'
}

// 保存会议主题
const saveMeetingTheme = async () => {
  try {
    await request.put(`/api/settings/meetingTheme`, {
      value: meetingTheme.value,
      type: 'string',
      description: '会议或活动的主题名称'
    })
    
    localStorage.setItem('meetingTheme', meetingTheme.value)
    ElMessage.success('会议主题已保存')
  } catch (error) {
    console.error('保存会议主题失败:', error)
    ElMessage.error('保存会议主题失败')
  }
}

// 初始化音频元素
const initAudioElement = () => {
  audioElement.value = new Audio()
  audioElement.value.volume = musicVolume.value / 100
  audioElement.value.addEventListener('ended', () => {
    isPlaying.value = false
  })
}

// 切换背景音乐开关
const toggleBackgroundMusic = async (enabled) => {
  try {
    await request.put(`/api/settings/backgroundMusicEnabled`, {
      value: enabled,
      type: 'boolean',
      description: '是否启用背景音乐'
    })
    
    localStorage.setItem('backgroundMusicEnabled', enabled.toString())
    if (!enabled && isPlaying.value) {
      stopMusic()
    }
    ElMessage.success(enabled ? '背景音乐已开启' : '背景音乐已关闭')
  } catch (error) {
    console.error('保存背景音乐设置失败:', error)
    ElMessage.error('保存背景音乐设置失败')
  }
}

// 音乐文件上传前检查
const beforeMusicUpload = (file) => {
  const isAudio = ['audio/mpeg', 'audio/wav', 'audio/ogg'].includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10
  
  if (!isAudio) {
    ElMessage.error('只能上传音频文件！')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB！')
    return false
  }
  return true
}

// 音乐文件上传成功
const handleMusicUploadSuccess = (response, file) => {
  if (response.success) {
    currentMusicUrl.value = response.url
    localStorage.setItem('currentMusicUrl', response.url)
    musicFileList.value = [{
      name: file.name,
      url: response.url
    }]
    ElMessage.success('音乐文件上传成功')
  } else {
    ElMessage.error('音乐文件上传失败')
  }
}

// 更新音乐音量
const updateMusicVolume = async (volume) => {
  try {
    await request.put(`/api/settings/musicVolume`, {
      value: volume,
      type: 'number',
      description: '背景音乐音量（0-100）'
    })
    
    localStorage.setItem('musicVolume', volume.toString())
    if (audioElement.value) {
      audioElement.value.volume = volume / 100
    }
  } catch (error) {
    console.error('保存音量设置失败:', error)
    ElMessage.error('保存音量设置失败')
  }
}

// 试听音乐
const testPlayMusic = () => {
  if (!audioElement.value || !currentMusicUrl.value) return
  
  if (isPlaying.value) {
    stopMusic()
  } else {
    playMusic()
  }
}

// 播放音乐
const playMusic = () => {
  if (audioElement.value && currentMusicUrl.value) {
    audioElement.value.src = currentMusicUrl.value
    audioElement.value.play()
    isPlaying.value = true
  }
}

// 停止音乐
const stopMusic = () => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.currentTime = 0
    isPlaying.value = false
  }
}

// 切换轮次抽奖开关
const toggleRoundLottery = async (enabled) => {
  try {
    await request.put(`/api/settings/roundLotteryEnabled`, {
      value: enabled,
      type: 'boolean',
      description: '是否启用轮次抽奖功能'
    })
    
    localStorage.setItem('roundLotteryEnabled', enabled.toString())
    ElMessage.success(enabled ? '轮次抽奖功能已启用' : '轮次抽奖功能已禁用')
  } catch (error) {
    console.error('保存轮次抽奖设置失败:', error)
    ElMessage.error('保存轮次抽奖设置失败')
  }
}
</script>

<style lang="scss" scoped>
.settings-container {
  .settings-section {
    margin-bottom: 30px;
    
    h3 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 18px;
      font-weight: 600;
    }
    
    .section-desc {
      color: #909399;
      margin-bottom: 20px;
    }
  }
  
  .background-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    
    .background-option {
      width: 150px;
      cursor: pointer;
      border: 2px solid transparent;
      border-radius: 4px;
      overflow: hidden;
      transition: all 0.3s;
      
      &.active {
        border-color: #409eff;
      }
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      }
      
      img {
        width: 100%;
        height: 100px;
        object-fit: cover;
      }
      
      .bg-name {
        padding: 8px;
        text-align: center;
        font-size: 14px;
      }
    }
  }
  
  .data-actions {
    display: flex;
    gap: 20px;
    
    .action-card {
      flex: 1;
      
      .action-header {
        font-weight: bold;
      }
      
      .action-content {
        p {
          margin-bottom: 15px;
          color: #606266;
        }
      }
    }
  }
  
  .music-upload {
    :deep(.el-upload) {
      width: 100%;
    }
  }
  
  .setting-desc {
    .enabled-desc {
      color: #67c23a;
      font-weight: 500;
      margin: 0;
    }
    
    .disabled-desc {
      color: #f56c6c;
      font-weight: 500;
      margin: 0;
    }
  }
}
</style>