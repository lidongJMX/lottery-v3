<template>
  <div class="home-container">
    <div class="background">
      <video class="videoBg" src="../assets/背景视频.mp4" autoplay="autoplay" loop="loop" muted="muted"
        data-src="../assets/背景视频.mp4"
        style="width: 1482px; height: auto; left: 0px; top: 50%; margin-left: 0px; margin-top: -463.125px;">
      </video>
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
            <div class="awardbox" :class="{ hidden: isLotteryRunning }">
              <div class="prizeimg">
                <img src="../assets/img/awardbg.png">
              </div>
            </div>
          </div>
          <div class="content-luckbox" :class="{ active: isLotteryRunning }" ref="luckBox">
            <div class="luckerbox-content" ref="luckerBoxContent">
              <!-- 3D动画容器 -->
              <div id="three-container" ref="threeContainer" :style="{ display: isLotteryRunning ? 'block' : 'none' }"></div>
            </div>
          </div>
          
        </div>
        <div class="lottery-footer" :class="{ hidden: isLotteryRunning }">
          <div class="footer-bg">
            <!-- 左侧区域：奖项切换 -->
            <div class="left-section">
              <div class="lottory-number">
                <div class="lottory-prev-btn" @click="prevAward" title="上一个奖项"></div>
                <div class="active-awardname limitbox">{{ currentAwardName }}</div>
                <div class="lottory-next-btn" @click="nextAward" title="下一个奖项"></div>
              </div>
            </div>
            
            <!-- 中间区域：开始抽奖按钮 -->
            <div class="center-section">
              <div class="lottory-startbtn">
                <el-button type="primary" @click="startLottery" :disabled="isLotteryRunning">
                  {{ isLotteryRunning ? '抽奖中...' : '开始抽奖' }}
                </el-button>
              </div>
            </div>
            
            <!-- 右侧区域：人数调整和中奖名单 -->
            <div class="right-section">
              <div class="lottory-drawcountbox">
                <img id="prize_decrement" src="/src/assets/img/reduce.png" @click="decrementDrawCount" title="减少抽取人数">
                <input class="numbernum" :value="currentDrawCount" readonly>
                <img id="prize_increment" src="/src/assets/img/add.png" @click="incrementDrawCount" title="增加抽取人数">
              </div>
              <div class="lottory-selectDialog" @click="showWinnerDialog = true" :disabled="isLotteryRunning">中奖名单</div>
            </div>
          </div>
        </div>

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
import { ref, onMounted, onUnmounted, computed, h, nextTick, markRaw } from 'vue'
import * as THREE from 'three';
import BottomNavigation from '../components/BottomNavigation.vue'
import { participantUtils, awardUtils, winnerUtils } from '../utils/lotteryUtils.js'
import { ElMessage } from 'element-plus'

// 3D动画相关
const threeContainer = ref(null);
const luckBox = ref(null);
const scene = ref(null);
const camera = ref(null);
const renderer = ref(null);
const animationId = ref(null);
const nameMeshes = ref([]);
const clock = ref(new THREE.Clock());
const allParticipantNames = ref([]); // 存储所有参与者名字用于循环显示

// 页面可见性检测相关变量
const isPageVisible = ref(true);
const lastTime = ref(0);

// 初始化3D场景
const initThreeScene = () => {
  if (!threeContainer.value) {
    console.error('Three.js container not found');
    return;
  }
  
  scene.value = markRaw(new THREE.Scene());
  
  // 获取容器尺寸
  const container = threeContainer.value;
  let width = container.clientWidth;
  let height = container.clientHeight;
  
  // 如果容器尺寸为0，使用默认尺寸
  if (width === 0 || height === 0) {
    width = 1000;
    height = 500;
    console.warn('Container size is 0, using default size:', width, 'x', height);
  }
  
  console.log('Initializing Three.js scene with size:', width, 'x', height);
  
  // 创建相机
  camera.value = markRaw(new THREE.PerspectiveCamera(75, width / height, 0.1, 1000));
  camera.value.position.z = 5;
  
  // 创建渲染器
  renderer.value = markRaw(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
  renderer.value.setSize(width, height);
  renderer.value.setClearColor(0x000000, 0); // 透明背景
  container.appendChild(renderer.value.domElement);
  
  console.log('Three.js scene initialized successfully');
};

// 改进的梯形位置计算函数
const getTrapezoidPosition = () => {
  const trapezoidWidth = 3;   // 梯形基础宽度
  const trapezoidDepth = 10;   // 梯形深度
  const taperCoeff = 0.5;     // 锥度系数
  
  // 随机生成梯形内的Z坐标（从窄端到宽端）
  const z = -trapezoidDepth + Math.random() * trapezoidDepth;
  // 根据Z坐标计算当前位置的宽度（Z越小越窄）
  const currentWidth = trapezoidWidth * (1 - taperCoeff * (z + trapezoidDepth) / trapezoidDepth);
  
  return {
    x: (Math.random() - 0.5) * currentWidth,
    y: (Math.random() - 0.5) * currentWidth,
    z: z
  };
};

// 创建名字3D文本
const createNameMesh = (name) => {
  console.log('Creating mesh for name:', name);
  
  // 创建简单的文本精灵而不是3D文本几何体，避免字体加载问题
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;
  
  // 清除画布
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // 设置文本样式
  context.font = 'Bold 24px Arial';
  const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
  
  // 绘制圆角矩形背景
  const padding = 8;
  const borderRadius = 12;
  const rectX = padding;
  const rectY = padding;
  const rectWidth = canvas.width - padding * 2;
  const rectHeight = canvas.height - padding * 2;
  
  // 创建圆角矩形路径
  context.beginPath();
  context.moveTo(rectX + borderRadius, rectY);
  context.lineTo(rectX + rectWidth - borderRadius, rectY);
  context.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + borderRadius);
  context.lineTo(rectX + rectWidth, rectY + rectHeight - borderRadius);
  context.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - borderRadius, rectY + rectHeight);
  context.lineTo(rectX + borderRadius, rectY + rectHeight);
  context.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - borderRadius);
  context.lineTo(rectX, rectY + borderRadius);
  context.quadraticCurveTo(rectX, rectY, rectX + borderRadius, rectY);
  context.closePath();
  
  // 填充背景（带透明度）
  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, '#ffffff');
  context.fillStyle = gradient;
  context.globalAlpha = 0.8; // 设置透明度
  context.fill();
  
  // 绘制边框
  context.globalAlpha = 1.0;
  context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  context.lineWidth = 2;
  context.stroke();
  
  // 绘制文本
  context.fillStyle = 'rgba(0, 0, 0, 0.9)';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(name, canvas.width / 2, canvas.height / 2);
  console.log('Text drawn on canvas:', name, 'with color:', color);
  
  // 创建纹理
  const texture = markRaw(new THREE.CanvasTexture(canvas));
  texture.needsUpdate = true;
  
  // 创建精灵材质
  const material = markRaw(new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    opacity: 0.9
  }));
  
  // 创建精灵
  const sprite = markRaw(new THREE.Sprite(material));
  sprite.scale.set(0.1, 0.025, 0.1); // 初始很小，符合从小到大的效果
  
  // 生成初始位置（使用改进的梯形算法）
  const position = getTrapezoidPosition();
  sprite.position.set(position.x, position.y, position.z);
  
  // 改进的飞行方向计算（向外扩散效果）
  const direction = new THREE.Vector3(
    sprite.position.x * 0.3,  // X方向基于当前位置向外扩散
    sprite.position.y * 0.3,  // Y方向基于当前位置向外扩散
    1                         // Z方向向前飞出
  ).normalize();
  
  // 添加一些随机性使飞行更自然
  direction.x += (Math.random() - 0.5) * 0.2;
  direction.y += (Math.random() - 0.5) * 0.2;
  direction.normalize();
  
  sprite.userData = {
    velocity: direction.multiplyScalar(0.03), // 统一飞行速度
    rotationSpeed: (Math.random() - 0.5) * 0.08, // 降低旋转速度
    scale: 0.1, // 初始很小
    maxScale: 1.2, // 降低最大缩放，避免文字过大
    life: 0,
    name: name, // 添加名字用于调试
    regenerateDelay: null,
    waitingToRegenerate: false
  };
  
  scene.value.add(sprite);
  nameMeshes.value.push(sprite);
  
  console.log('Sprite created and added to scene:', sprite.position, sprite.scale);
  
  return Promise.resolve();
};

// 动画循环
const animate = () => {
  if (!isLotteryRunning.value || !renderer.value || !scene.value || !camera.value) {
    if (!isLotteryRunning.value) {
      console.log('Animation stopped: lottery not running');
    }
    return;
  }
  
  animationId.value = requestAnimationFrame(animate);
  
  // 页面可见性检测 - 如果页面不可见，暂停动画时钟
  if (!isPageVisible.value) {
    // 页面不可见时，只渲染当前帧，不更新动画状态
    renderer.value.render(scene.value, camera.value);
    return;
  }
  
  const delta = clock.value.getDelta();
  
  // 更新每个名字的位置、旋转和缩放
  nameMeshes.value.forEach((sprite, index) => {
    // 更新生命周期
    sprite.userData.life += delta;
    
    // 更新位置
    sprite.position.add(sprite.userData.velocity);
    
    // Z轴自转
    sprite.material.rotation += sprite.userData.rotationSpeed * delta;
    
    // 从小到大缩放动画，然后自然消失
      let opacity = 1; // 默认完全不透明
      
      if (sprite.userData.scale < sprite.userData.maxScale) {
        // 放大阶段
        sprite.userData.scale += delta * 1.5; // 降低缩放速度，使动画更平缓
        const scale = Math.min(sprite.userData.scale, sprite.userData.maxScale);
        sprite.scale.set(scale, scale * 0.25, scale);
        opacity = Math.min(1, sprite.userData.scale / sprite.userData.maxScale); // 渐现效果
      } else if (sprite.userData.life < 3) {
        // 保持阶段 - 在最大尺寸保持一段时间
        opacity = 1;
      } else {
        // 消失阶段 - 渐变透明
        const fadeTime = 2; // 消失时间
        const fadeProgress = Math.min(1, (sprite.userData.life - 3) / fadeTime);
        opacity = 1 - fadeProgress;
        
        // 同时轻微缩小
        const shrinkFactor = 1 - fadeProgress * 0.3;
        const currentScale = sprite.userData.maxScale * shrinkFactor;
        sprite.scale.set(currentScale, currentScale * 0.25, currentScale);
      }
      
      sprite.material.opacity = opacity;
    
    // 边界检查和生命周期管理 - 只有在完全消失或飞出边界时才重新生成
    if (Math.abs(sprite.position.x) > 12 || Math.abs(sprite.position.y) > 12 || sprite.position.z > 8 || sprite.userData.life > 5) {
      // 缩短延迟时间，保持动画连续性
      if (!sprite.userData.regenerateDelay) {
        sprite.userData.regenerateDelay = Math.random() * 0.5 + 0.2; // 0.2-0.7秒随机延迟
        sprite.userData.waitingToRegenerate = true;
        sprite.material.opacity = 0; // 隐藏精灵
        return; // 跳过这一帧的更新
      }
      
      sprite.userData.regenerateDelay -= delta;
      if (sprite.userData.regenerateDelay > 0) {
        return; // 继续等待
      }
      
      // 重新生成精灵，随机选择新的名字
       const newName = allParticipantNames.value[Math.floor(Math.random() * allParticipantNames.value.length)];
       console.log(`精灵 ${sprite.userData.name} 重新生成为 ${newName}`);
       
       // 更新精灵的名字和纹理
       sprite.userData.name = newName;
       
       // 重新创建纹理
       const canvas = document.createElement('canvas');
       const context = canvas.getContext('2d');
       canvas.width = 160;
       canvas.height = 64;
       
       // 清除画布
       context.clearRect(0, 0, canvas.width, canvas.height);
       
       // 设置文本样式
       context.font = 'Bold 24px Arial';
       const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
       
       // 绘制圆角矩形背景
       const padding = 2;
       const borderRadius = 12;
       const rectX = padding;
       const rectY = padding;
       const rectWidth = canvas.width - padding * 2;
       const rectHeight = canvas.height - padding * 2;
       
       // 创建圆角矩形路径
       context.beginPath();
       context.moveTo(rectX + borderRadius, rectY);
       context.lineTo(rectX + rectWidth - borderRadius, rectY);
       context.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + borderRadius);
       context.lineTo(rectX + rectWidth, rectY + rectHeight - borderRadius);
       context.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - borderRadius, rectY + rectHeight);
       context.lineTo(rectX + borderRadius, rectY + rectHeight);
       context.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - borderRadius);
       context.lineTo(rectX, rectY + borderRadius);
       context.quadraticCurveTo(rectX, rectY, rectX + borderRadius, rectY);
       context.closePath();
       
       // 填充背景（带透明度）
       const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
       gradient.addColorStop(0, color);
       gradient.addColorStop(1, '#ffffff');
       context.fillStyle = gradient;
       context.globalAlpha = 0.8; // 设置透明度
       context.fill();
       
       // 绘制边框
       context.globalAlpha = 1.0;
       context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
       context.lineWidth = 2;
       context.stroke();
       
       // 绘制文本
       context.fillStyle = 'rgba(0, 0, 0, 0.9)';
       context.textAlign = 'center';
       context.textBaseline = 'middle';
       context.fillText(newName, canvas.width / 2, canvas.height / 2);
       
       // 更新纹理
       const newTexture = markRaw(new THREE.CanvasTexture(canvas));
       newTexture.needsUpdate = true;
       sprite.material.map.dispose(); // 释放旧纹理
       sprite.material.map = newTexture;
       sprite.material.needsUpdate = true;
       
       // 使用改进的梯形位置重新生成
       const newPosition = getTrapezoidPosition();
       sprite.position.set(newPosition.x, newPosition.y, newPosition.z);
       
       // 重新计算飞行方向（向外扩散效果）
       const direction = new THREE.Vector3(
         sprite.position.x * 0.3,
         sprite.position.y * 0.3,
         1
       ).normalize();
       
       // 添加随机性
       direction.x += (Math.random() - 0.5) * 0.2;
       direction.y += (Math.random() - 0.5) * 0.2;
       direction.normalize();
       sprite.userData.velocity = direction.multiplyScalar(0.02); // 统一速度
       sprite.userData.rotationSpeed = (Math.random() - 0.5) * 0.08; // 降低旋转速度
       sprite.userData.scale = 0.1; // 重新开始时很小
       sprite.userData.maxScale = 1.2; // 降低最大缩放，避免文字过大
       sprite.userData.life = 0;
       sprite.userData.regenerateDelay = null;
       sprite.userData.waitingToRegenerate = false;
       sprite.material.opacity = 0.1;
       sprite.scale.set(0.1, 0.025, 0.1); // 重置精灵缩放
    }
  });
  
  renderer.value.render(scene.value, camera.value);
};

// 添加调试函数
const debugThreeScene = () => {
  console.log('=== Three.js Debug Info ===');
  console.log('Scene:', scene.value);
  console.log('Camera:', camera.value);
  console.log('Renderer:', renderer.value);
  console.log('Container:', threeContainer.value);
  console.log('Name meshes count:', nameMeshes.value.length);
  console.log('Is lottery running:', isLotteryRunning.value);
  if (scene.value) {
    console.log('Scene children count:', scene.value.children.length);
  }
};

// 清除3D场景
const clearThreeScene = () => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
    animationId.value = null;
  }
  
  if (scene.value) {
    nameMeshes.value.forEach(mesh => {
      scene.value.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    nameMeshes.value = [];
  }
  
  if (renderer.value && threeContainer.value) {
    threeContainer.value.removeChild(renderer.value.domElement);
    renderer.value.dispose();
    renderer.value = null;
  }
};

// 开始3D抽奖动画
const start3DLottery = async (names) => {
  console.log('Starting 3D lottery with names:', names);
  
  clearThreeScene();
  initThreeScene();
  
  if (!scene.value || !renderer.value) {
    console.error('Scene or renderer not initialized');
    return;
  }
  
  // 限制同时显示的精灵数量为15-20个
  const maxSprites = Math.min(35, Math.max(30, Math.ceil(names.length * 0.4))); // 动态调整，但不超过20个
  console.log(`Creating ${maxSprites} sprites from ${names.length} names`);
  
  // 存储所有名字用于循环显示
  allParticipantNames.value = [...names];
  
  // 随机选择初始显示的名字
  const shuffledNames = [...names].sort(() => Math.random() - 0.5);
  const initialNames = shuffledNames.slice(0, maxSprites);
  
  // 创建固定数量的精灵，错开初始生命周期以保持连续性
  for (let i = 0; i < maxSprites; i++) {
    const nameToShow = initialNames[i] || names[i % names.length]; // 防止数组越界
    await createNameMesh(nameToShow);
    
    // 为每个精灵设置不同的初始生命周期，避免同时重新生成
    if (nameMeshes.value[i]) {
      nameMeshes.value[i].userData.life = (i / maxSprites) * 3; // 错开0-3秒的初始生命周期
    }
    
    console.log(`Created mesh for: ${nameToShow} with initial life: ${(i / maxSprites) * 3}`);
  }
  
  console.log(`Created ${nameMeshes.value.length} name meshes (max: ${maxSprites})`);
  
  // 开始动画
  console.log('Starting animation loop');
  animate();
};

// 修改startLottery方法
const startLottery = async () => {
  console.log('=== Starting Lottery ===');
  
  if (isLotteryRunning.value) return;
  
  // 检查是否有参与者
  if (!participants.value || participants.value.length === 0) {
    ElMessage.warning('暂无参与者！');
    return;
  }
  
  console.log('Participants found:', participants.value.length);
  
  isLotteryRunning.value = true;
  
  try {
    // 获取所有参与者名字
    const names = participants.value.map(p => p.name);
    console.log('Names for 3D animation:', names);
    
    // 等待DOM更新
    await nextTick();
    
    // 调试Three.js场景状态
    setTimeout(() => {
      debugThreeScene();
    }, 100);
    
    // 开始3D抽奖动画
    await start3DLottery(names);
    
  } catch (error) {
    console.error('抽奖错误:', error);
    ElMessage.error('抽奖过程中出现错误');
    isLotteryRunning.value = false;
  }
};

// 修改stopLottery方法
const stopLottery = () => {
  if (!isLotteryRunning.value) return;
  
  clearThreeScene();
  isLotteryRunning.value = false;
  
  // 选择中奖者
  selectWinners();
};

// 页面可见性变化处理
const handleVisibilityChange = () => {
  isPageVisible.value = !document.hidden;
  
  if (isPageVisible.value) {
    // 页面重新可见时，重置时钟以避免时间跳跃
    if (clock.value) {
      clock.value.getDelta(); // 重置时钟
    }
    console.log('页面重新可见，动画恢复');
  } else {
    console.log('页面失去焦点，动画暂停');
  }
};

onMounted(() => {
  loadawards();
  loadWinners();
  loadParticipants();
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown);
  
  // 添加页面可见性监听
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // 初始化3D容器
  nextTick(() => {
    if (threeContainer.value && !renderer.value) {
      initThreeScene();
    }
  });
});

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown);
  
  // 移除页面可见性监听
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  
  // 清理3D场景
  clearThreeScene();
});

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
// 动画定时器（保留用于其他可能的定时任务）
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

// 移除重复的onMounted

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

// // 开始抽奖
// const startLottery = () => {
//   if (isLotteryRunning.value) return
  
//   // 检查是否有参与者
//   if (!participants.value || participants.value.length === 0) {
//     ElMessage.warning('暂无参与者！')
//     return
//   }
  
// }

// 移除重复的stopLottery方法定义

// 选择中奖者
const selectWinners = () => {
  const drawCount = currentDrawCount.value
  const availableParticipants = participants.value.filter(p => 
    !winners.value || !winners.value.some(w => w.participant_id === p.id)
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
