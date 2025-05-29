<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="login-title">登录</h2>
      <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin" 
            class="login-btn"
            :loading="loading"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = ref({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = () => {
  loginFormRef.value.validate(valid => {
    if (!valid) return
    
    loading.value = true
    
    // 模拟登录请求
    setTimeout(() => {
      localStorage.setItem('token', 'mock-token')
      ElMessage.success('登录成功')
      router.push('/')
      loading.value = false
    }, 1000)
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #ff4d4d 0%, #ff8c8c 100%);
  
  .login-card {
    width: 400px;
    padding: 30px;
    border-radius: 10px;
    background-color: #ffffff;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    
    .login-title {
      text-align: center;
      margin-bottom: 30px;
      color: #ff4d4d;
    }
    
    .login-btn {
      width: 100%;
    }
  }
}
</style>