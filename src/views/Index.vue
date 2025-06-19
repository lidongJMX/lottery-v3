<template>
  <div class="index-container">
    <el-container>
      <el-main>
        <div class="content">
          <h2>🎰 老虎机抽奖</h2>
          
        </div>
      </el-main>
    </el-container>
  </div>
  <!-- 引入底部导航栏组件 -->
  <BottomNavigation />
</template>

<style lang="scss" scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft YaHei', sans-serif;
  background-color: #f5f5f5;
  line-height: 1.5;
}

.test {
  width: 300px;
  height: 120px;
  overflow: hidden;
  position: relative;
  margin: 0 auto;
  border: 4px solid #FFD700;
  border-radius: 15px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  box-shadow: 
    0 0 30px rgba(255, 215, 0, 0.5),
    inset 0 0 20px rgba(0, 0, 0, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #FFD700, #FFA500, #FFD700, #FFA500);
    border-radius: 17px;
    z-index: -1;
    animation: borderGlow 2s ease-in-out infinite alternate;
  }
}

@keyframes borderGlow {
  0% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  }
  100% {
    box-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
  }
}
.index-container {
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background-image: url("../assets/img/a.jpg");
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.el-container {
  width: 100%;
  height: 100%;
}

.el-main {
  position: relative;
  display: flex;
  flex-direction: column;
  z-index: 100;
  padding: 0 0;
  width: 100%;
  height: 100%;
  // min-height: calc(100vh - 60px);
  overflow-x: hidden;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
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

.names-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.name-item {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #333;
  border-bottom: 1px solid #eee;
  background: rgba(255, 255, 255, 0.9);
  margin-bottom: 2px;
  font-weight: 500;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.02);
  }
}

.control-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.start-btn, .stop-btn {
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  
  &:hover:not(:disabled) {
    background: linear-gradient(45deg, #45a049, #4CAF50);
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

.stop-btn {
  background: linear-gradient(45deg, #f44336, #da190b);
  color: white;
  
  &:hover:not(:disabled) {
    background: linear-gradient(45deg, #da190b, #f44336);
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}
</style>

<script setup>
import BottomNavigation from '../components/BottomNavigation.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue';

const names = ref([
  '张三',
  '李四',
  '王五',
  '赵六',
  '钱七',
  '孙八'
]);

const namesWrapper = ref(null);
const isScrolling = ref(false);
const scrollInterval = ref(null);
const currentOffset = ref(0);
const itemHeight = 42; // 40px height + 2px margin

// 创建显示用的名字列表，包含重复项以实现无限滚动
const displayNames = computed(() => {
  // 复制两倍的名单数据，确保首尾相连的平滑滚动
  return [...names.value, ...names.value];
});

const startScroll = () => {
  if (isScrolling.value) return;
  
  isScrolling.value = true;
  
  // 老虎机效果：快速滚动
  scrollInterval.value = setInterval(() => {
    currentOffset.value += 8; // 更快的滚动速度
    
    if (namesWrapper.value) {
      namesWrapper.value.style.transform = `translateY(-${currentOffset.value}px)`;
      // namesWrapper.value.style.filter = 'blur(2px)'; // 添加模糊效果
    }
  }, 200); // 更快的刷新频率
};

const stopScroll = () => {
  if (!isScrolling.value) return;
  
  // 老虎机效果：先减速再停止
  let slowDownSteps = 0;
  const maxSlowDownSteps = 15;
  
  if (scrollInterval.value) {
    clearInterval(scrollInterval.value);
  }
  
  // 减速阶段
  const slowDownInterval = setInterval(() => {
    slowDownSteps++;
    const speed = Math.max(1, 8 - slowDownSteps * 0.5); // 逐渐减速
    currentOffset.value += speed;
    
    if (namesWrapper.value) {
      namesWrapper.value.style.transform = `translateY(-${currentOffset.value}px)`;
    }
    
    if (slowDownSteps >= maxSlowDownSteps) {
      clearInterval(slowDownInterval);
      
      // 最终停止并对齐
      if (namesWrapper.value) {
        // 随机选择一个停止位置，确保在第一组名字范围内
        const randomIndex = Math.floor(Math.random() * names.value.length);
        const targetOffset = randomIndex * itemHeight;
        
        namesWrapper.value.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        namesWrapper.value.style.transform = `translateY(-${targetOffset}px)`;
        // namesWrapper.value.style.filter = 'blur(0px)'; // 移除模糊效果
        
        // 高亮选中的名字
        setTimeout(() => {
          const selectedName = names.value[randomIndex];
          console.log('选中的名字:', selectedName);
          
          // 添加闪烁效果 - 同时高亮第一组和第二组中的相同名字
          if (namesWrapper.value) {
            const nameItems = namesWrapper.value.querySelectorAll('.name-item');
            // 高亮第一组中的选中项
            if (nameItems[randomIndex]) {
              nameItems[randomIndex].style.background = 'linear-gradient(45deg, #FFD700, #FFA500)';
              nameItems[randomIndex].style.color = '#fff';
              nameItems[randomIndex].style.fontWeight = 'bold';
              nameItems[randomIndex].style.transform = 'scale(1.1)';
              nameItems[randomIndex].style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
            }
            // 高亮第二组中的相同名字
            const secondGroupIndex = randomIndex + names.value.length;
            if (nameItems[secondGroupIndex]) {
              nameItems[secondGroupIndex].style.background = 'linear-gradient(45deg, #FFD700, #FFA500)';
              nameItems[secondGroupIndex].style.color = '#fff';
              nameItems[secondGroupIndex].style.fontWeight = 'bold';
              nameItems[secondGroupIndex].style.transform = 'scale(1.1)';
              nameItems[secondGroupIndex].style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
            }
          }
        }, 500);
        
        // 重置状态
        setTimeout(() => {
          if (namesWrapper.value) {
            namesWrapper.value.style.transition = '';
            // 重置所有名字的样式
            const nameItems = namesWrapper.value.querySelectorAll('.name-item');
            nameItems.forEach(item => {
              item.style.background = 'rgba(255, 255, 255, 0.8)';
              item.style.color = '#333';
              item.style.fontWeight = 'normal';
              item.style.transform = 'scale(1)';
              item.style.boxShadow = 'none';
            });
          }
          isScrolling.value = false;
        }, 2000);
        
        currentOffset.value = targetOffset;
      }
    }
  }, 50);
};

// 组件卸载时清理定时器
onUnmounted(() => {
  if (scrollInterval.value) {
    clearInterval(scrollInterval.value);
  }
});
</script>