import request from '@/utils/request'

// 获取奖项列表
export function getAwardList() {
  return request({
    url: '/api/awards',
    method: 'get'
  })
}

// 添加奖项
export function addAward(data) {
  return request({
    url: '/api/awards',
    method: 'post',
    data
  })
}

// 更新奖项
export function updateAward(id, data) {
  return request({
    url: `/api/awards/${id}`,
    method: 'put',
    data
  })
}

// 删除奖项
export function deleteAward(id) {
  return request({
    url: `/api/awards/${id}`,
    method: 'delete'
  })
}

// 获取奖项详情
export function getAwardDetail(id) {
  return request({
    url: `/api/awards/${id}`,
    method: 'get'
  })
} 