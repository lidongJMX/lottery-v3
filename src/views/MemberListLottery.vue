<template>
  <div class="home-container">
    <el-container>
      <el-main>
        
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
      position: relative;
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

      .delete-icon {
        position: absolute;
        top: 5px;
        right: 5px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s ease;
        font-size: 14px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: rgba(255, 255, 255, 1);
        }
      }

      &:hover .delete-icon {
        opacity: 1;
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
        font-size: 12px;
        font-weight: 500;
        padding: 0px 0px;
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
  font-size: 40px;
  margin-bottom: 30px;
  color: #edaa00;
  text-shadow: 0 0 10px #edaa00, 0 0 20px #edaa00, 0 0 30px #edaa00;
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