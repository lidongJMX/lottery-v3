<template>
  <div class="index-container">
    <el-container>
      <el-main>
          <div class="content">
            <h2>欢迎</h2>
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
.index-container {
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background-image: url("../assets/img/a.jpg") ;
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

</style>

<script setup>
import BottomNavigation from '../components/BottomNavigation.vue'
</script>