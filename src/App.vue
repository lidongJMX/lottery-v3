<template>
  <div class="app-container">
    <el-config-provider :locale="zhCn">
      <router-view />
    </el-config-provider>
  </div>
</template>

<script setup>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
</script>

<style lang="scss">
@use "./styles/main.scss" as *;

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff4d4d 0%, #ff8c8c 100%);
}
</style>