const axios = require('axios')
const API_BASE_URL = 'http://localhost:8000/api' // 后端API基础地址

// 封装API请求方法
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      data
    })
    return response.data
  } catch (error) {
    console.error('API请求错误:', error)
    throw error
  }
}

// 封装查询方法
const query = async (endpoint, params = {}) => {
  return apiRequest('get', endpoint, { params })
}

module.exports = {
  query
}