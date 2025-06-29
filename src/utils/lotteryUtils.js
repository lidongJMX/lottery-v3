/**
 * 抽奖系统通用工具函数
 * 从Home.vue中提取的各种通用函数
 */

import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

/**
 * 奖项管理相关函数
 */
export const awardUtils = {
  /**
   * 获取奖项列表
   * @param {boolean} initializeIndex - 是否初始化当前奖项索引
   * @returns {Promise<Array>} 奖项列表
   */
  async loadAwards(initializeIndex = true) {
    console.log('开始获取奖项列表...')
    try {
      const response = await fetch('/api/awards')
      console.log('奖项列表响应状态:', response.status)
      if (!response.ok) {
        console.error('奖项列表响应异常:', response)
        throw new Error('获取奖项列表失败')
      }
      const data = await response.json()
      console.log('成功获取奖项列表:', data)
      return { data, initializeIndex }
    } catch (error) {
      console.error('获取奖项列表错误:', error)
      throw error
    }
  },

  /**
   * 切换到上一个奖项
   * @param {Array} awards - 奖项列表
   * @param {number} currentIndex - 当前奖项索引
   * @returns {Object} 新的奖项信息
   */
  prevAward(currentIndex, awards) {
    if (awards.length === 0) return null

    const newIndex = currentIndex > 0 ? currentIndex - 1 : awards.length - 1
    const award = awards[newIndex]
    
    return {
      index: newIndex,
      name: award.name,
      drawCount: award.draw_count || 1
    }
  },

  /**
   * 切换到下一个奖项
   * @param {Array} awards - 奖项列表
   * @param {number} currentIndex - 当前奖项索引
   * @returns {Object} 新的奖项信息
   */
  nextAward(currentIndex, awards) {
    if (awards.length === 0) return null
    console.log('当前奖项索引:', awards)
    const newIndex = currentIndex < awards.length - 1 ? currentIndex + 1 : 0
    const award = awards[newIndex]
    console.log('新的奖项索引:', newIndex)
    return {
      index: newIndex,
      name: award.name,
      drawCount: award.draw_count || 1
    }
  },

  /**
   * 减少抽取人数
   * @param {number} currentCount - 当前抽取人数
   * @param {Object} selectedAward - 当前选中的奖项
   * @returns {Object} 操作结果
   */
  decrementDrawCount(currentCount, selectedAward) {
    if (currentCount > 1) {
      return {
        success: true,
        newCount: currentCount - 1
      }
    } else {
      ElMessage.warning('抽取人数不能少于1人')
      return {
        success: false,
        newCount: currentCount
      }
    }
  },

  /**
   * 增加抽取人数
   * @param {number} currentCount - 当前抽取人数
   * @param {Object} selectedAward - 当前选中的奖项
   * @returns {Object} 操作结果
   */
  incrementDrawCount(currentCount, selectedAward) {
    const maxCount = selectedAward.remaining_count || 1
    if (currentCount < maxCount) {
      return {
        success: true,
        newCount: currentCount + 1
      }
    } else {
      ElMessage.warning(`抽取人数不能超过剩余奖项数量: ${maxCount}`)
      return {
        success: false,
        newCount: currentCount
      }
    }
  },

  /**
   * 更新抽取人数到数据库
   * @param {Object} id - 当前选中的奖项
   * @param {number} drawCount - 抽取人数
   * @returns {Promise<boolean>} 更新结果
   */
  async updateDrawCountToDatabase(id, drawCount) {
    try {
      const response = await fetch(`/api/awards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          draw_count: drawCount
        })
      })

      if (!response.ok) {
        throw new Error('更新抽取人数失败')
      }

      return true
    } catch (error) {
      console.error('更新抽取人数错误:', error)
      ElMessage.error('更新抽取人数失败')
      return false
    }
  },

  /**
   * 根据奖项ID获取颜色
   * @param {number} awardId - 奖项ID
   * @param {Array} awards - 奖项列表
   * @returns {string} 颜色值
   */
  getAwardColor(awardId, awards) {
    const award = awards.find(a => a.id === awardId)
    if (!award) return '#ff4d4d'

    const colors = ['#ff4d4d', '#ff9800', '#4caf50'] // 红、橙、绿对应不同奖项等级
    return colors[award.level - 1] || '#ff4d4d'
  }
}

/**
 * 参与者管理相关函数
 */
export const participantUtils = {
  /**
   * 加载参与者列表
   * @returns {Promise<Array>} 参与者列表
   */
  async loadParticipants() {
    try {
      const response = await fetch('/api/participants/lottery')
      if (!response.ok) throw new Error('获取抽奖名单失败')
      const lotteryData = await response.json()
      console.log('成功获取抽奖名单:', lotteryData)
      return lotteryData
    } catch (error) {
      console.error('获取抽奖名单错误:', error)
      throw error
    }
  },

  /**
   * 打乱参与者列表
   * @param {Array} array - 原始数组
   * @returns {Array} 打乱后的数组
   */
  shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

/**
 * 中奖者管理相关函数
 */
export const winnerUtils = {
  /**
   * 加载中奖者列表
   * @returns {Promise<Array>} 中奖者列表
   */
  async loadWinners() {
    try {
      const response = await fetch('/api/lottery/winners/latest-round')
      if (!response.ok) throw new Error('获取最后一轮中奖者列表失败')
      const data = await response.json()
      
      // 检查返回的数据结构
      let winners
      if (!Array.isArray(data)) {
        winners = Array.isArray(data.winners) ? data.winners : []
      } else {
        winners = data
      }
      
      // 确保每个winner对象都有roundId和award_name
      winners = winners.map(winner => ({
        ...winner,
        roundId: winner.roundId || winner.round_id || winner.epoch || 0,
        award_name: winner.award_name || winner.Award?.name || winner.award || '未知奖项'
      }))
      
      console.log('成功获取最后一轮中奖者列表:', winners)
      return winners
    } catch (error) {
      console.error('获取最后一轮中奖者列表错误:', error)
      ElMessage.error('获取中奖名单失败，请稍后重试')
      throw error
    }
  },

  /**
   * 删除中奖者
   * @param {Object} winner - 中奖者信息
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteWinner(winner) {
    try {
      // 显示确认对话框
      await ElMessageBox.confirm(
        `确定要删除 ${winner.name} 的 ${winner.award_name} 中奖记录吗？此操作将恢复该参与者状态`,
        '警告',
        { type: 'warning' }
      )

      // 删除中奖者API调用
      console.log('删除中奖者:', winner)
      const response = await fetch(`/api/winners/${winner.user_code}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('删除中奖者失败')
      }

      ElMessage.success('删除成功')
      return true
    } catch (error) {
      console.error('删除中奖者错误:', error)
      if (error.name !== 'cancel') {
        ElMessage.error('删除失败: ' + error.message)
      }
      return false
    }
  },

  /**
   * 获取中奖者颜色
   * @param {Object} winner - 中奖者信息
   * @param {Array} awards - 奖项列表
   * @returns {string} 颜色值
   */
  getWinnerColor(winner, awards) {
    return winner.color || awardUtils.getAwardColor(winner.award_id, awards) || '#ff4d4d'
  },

  /**
   * 获取中奖者奖项名称
   * @param {Object} winner - 中奖者信息
   * @param {Array} awards - 奖项列表
   * @returns {string} 奖项名称
   */
  getWinnerAwardName(winner, awards) {
    return winner.award_name || winner.award || awards.find(a => a.id === winner.award_id)?.name || '未知奖项'
  }
}

/**
 * 抽奖逻辑相关函数
 */
export const lotteryUtils = {
  /**
   * 检查抽奖前置条件
   * @param {Object} award - 当前奖项
   * @param {Array} participants - 参与者列表
   * @returns {Promise<boolean>} 检查结果
   */
  async checkLotteryConditions(award, participants) {
    // 检查是否还有剩余奖项
    if (!award || award.remaining_count <= 0) {
      ElMessage.warning('当前奖项已抽完！')
      return false
    }

    // 校验同一轮中同一奖项不能重复抽取
    try {
      const checkResponse = await fetch('/api/lottery/check-round-award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          award_id: award.id,
          award_name: award.name
        })
      })

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json()
        ElMessage.warning(errorData.message || '校验失败')
        return false
      }
    } catch (error) {
      console.error('校验请求失败:', error)
      ElMessage.error('校验请求失败，请重试')
      return false
    }

    // 检查参与者列表
    if (participants.length === 0) {
      ElMessage.warning('所有参与者都已中奖！')
      return false
    }

    return true
  },

  /**
   * 停止抽奖并获取结果
   * @param {Array} awards - 要抽取的奖项列表
   * @returns {Promise<Object>} 抽奖结果
   */
  async stopLotteryAndGetResult(awards) {
    try {
      const response = await fetch('/api/lottery/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          awards_to_draw: awards,
        })
      })

      if (!response.ok) throw new Error('抽奖结果获取失败')
      const resultData = await response.json()
      return resultData
    } catch (error) {
      console.error('停止抽奖时出错:', error)
      ElMessage.error('抽奖失败，请重试')
      throw error
    }
  },

  /**
   * 处理抽奖结果
   * @param {Array} drawnWinners - 中奖者列表
   * @param {Array} updatedAwards - 更新后的奖项列表
   * @param {Array} awards - 原奖项列表
   * @returns {Object} 处理结果
   */
  handleLotteryResult(drawnWinners, updatedAwards, awards) {
    try {
      // 更新奖项剩余数量
      updatedAwards.forEach(updatedAward => {
        const award = awards.find(a => a.id === updatedAward.id)
        if (award) {
          award.remaining_count = updatedAward.remaining_count
        }
      })

      // 处理中奖者信息
      if (drawnWinners.length > 0) {
        const processedWinners = drawnWinners.map(winner => ({
          id: winner.participant_id,
          name: winner.name,
          award: awards.find(a => a.id === winner.award_id)?.name || '未知奖项',
          color: awardUtils.getAwardColor(winner.award_id, awards),
          department: winner.department || ''
        }))

        // 显示中奖消息
        const winnerNames = drawnWinners.map(w => w.name).join(', ')
        const awardNames = [...new Set(drawnWinners.map(w =>
          awards.find(a => a.id === w.award_id)?.name || '未知奖项'
        ))].join(', ')

        ElMessage.success(`恭喜 ${winnerNames} 获得 ${awardNames}！`)

        return {
          success: true,
          winners: processedWinners,
          drawnWinners
        }
      }

      return {
        success: true,
        winners: [],
        drawnWinners: []
      }
    } catch (error) {
      console.error('处理中奖结果时出错:', error)
      ElMessage.error('处理中奖结果失败')
      return {
        success: false,
        error: error.message
      }
    }
  }
}

/**
 * 数据管理相关函数
 */
export const dataUtils = {
  /**
   * 导出中奖名单到Excel
   * @returns {Promise<boolean>} 导出结果
   */
  async exportToExcel() {
    try {
      console.log('开始导出中奖名单...')
      const response = await fetch('/api/winners/export')
      if (!response.ok) throw new Error('获取中奖记录失败')

      // 将响应转换为blob
      const blob = await response.blob()

      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `中奖名单_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`

      // 触发下载
      document.body.appendChild(link)
      link.click()

      // 清理
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      ElMessage.success('导出成功')
      return true
    } catch (error) {
      console.error('导出失败:', error)
      ElMessage.error('导出失败，请稍后重试')
      return false
    }
  },

  /**
   * 重置抽奖数据
   * @returns {Promise<boolean>} 重置结果
   */
  async resetLotteryData() {
    try {
      // 显示确认对话框
      await ElMessageBox.confirm(
        '确定要重置所有中奖数据吗？此操作将清空所有中奖记录，恢复所有参与者状态，并重置奖项剩余数量。',
        '重置确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )

      // 用户确认后，调用重置API
      const response = await fetch('/api/lottery/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('重置失败')

      const result = await response.json()
      ElMessage.success(result.message || '重置成功')
      return true
    } catch (error) {
      if (error === 'cancel') return false
      console.error('重置抽奖数据失败:', error)
      ElMessage.error('重置失败，请稍后重试')
      return false
    }
  },

  /**
   * 清空所有数据
   * @returns {Promise<boolean>} 清空结果
   */
  async clearAllData() {
    try {
      // 显示确认对话框
      await ElMessageBox.confirm(
        '确定要清空所有数据吗？此操作将清空所有参与者列表、中奖记录，并重置奖项和轮次数据。此操作不可恢复！',
        '清空确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'danger',
        }
      )

      // 用户确认后，调用重置API
      const response = await fetch('/api/lottery/clearAllData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('清空失败')

      ElMessage.success('所有数据已清空')
      return true
    } catch (error) {
      if (error === 'cancel') return false
      console.error('清空数据失败:', error)
      ElMessage.error('清空失败，请稍后重试')
      return false
    }
  }
}

/**
 * 音效相关函数
 */
export const soundUtils = {
  /**
   * 播放抽奖音效
   */
  playLotterySound() {
    // 未来可以添加真实的音效实现
    console.log('播放抽奖音效')
  },

  /**
   * 播放中奖音效
   */
  playWinnerSound() {
    // 未来可以添加真实的音效实现
    console.log('播放中奖音效')
  }
}

/**
 * 全屏相关函数
 */
export const screenUtils = {
  /**
   * 切换全屏功能
   * @returns {Promise<boolean>} 切换结果
   */
  async toggleFullScreen() {
    try {
      if (!document.fullscreenElement) {
        // 进入全屏
        await document.documentElement.requestFullscreen()
        ElMessage.success('已进入全屏模式')
        return true
      } else {
        // 退出全屏
        await document.exitFullscreen()
        ElMessage.success('已退出全屏模式')
        return false
      }
    } catch (error) {
      console.error('切换全屏失败:', error)
      ElMessage.error('切换全屏失败，请检查浏览器权限')
      return null
    }
  }
}

/**
 * 计算相关的辅助函数
 */
export const computeUtils = {
  /**
   * 计算当前奖项的中奖者
   * @param {Array} winners - 所有中奖者列表
   * @param {string} currentAward - 当前奖项名称
   * @returns {Array} 当前奖项的中奖者
   */
  getCurrentAwardWinners(winners, currentAward) {
    if (winners.length === 0 || !currentAward) return []

    // 找出最后一轮的中奖记录
    const lastRoundId = Math.max(...winners.map(w => w.roundId || w.epoch || 0))

    // 过滤当前轮次且当前奖项的中奖者
    return winners.filter(w => {
      const winnerRoundId = w.roundId || w.epoch || 0
      const winnerAwardName = w.award_name || w.award || ''
      return winnerRoundId === lastRoundId && winnerAwardName === currentAward
    })
  },

  /**
   * 计算最后一轮中奖者
   * @param {Array} winners - 所有中奖者列表
   * @returns {Array} 最后一轮中奖者
   */
  getLastRoundWinners(winners) {
    if (winners.length === 0) return []

    // 找出最后一轮的中奖记录
    const lastRoundId = Math.max(...winners.map(w => w.roundId || 0))
    return winners.filter(w => (w.roundId || 0) === lastRoundId)
  },

  /**
   * 计算选中的奖项信息
   * @param {Array} awards - 奖项列表
   * @param {number} currentIndex - 当前奖项索引
   * @returns {Object} 选中的奖项信息
   */
  getSelectedAward(awards, currentIndex) {
    if (awards.length === 0) {
      return {
        name: '',
        description: '',
        count: 0,
        remaining_count: 0,
        draw_count: 1,
        level: 0
      }
    }

    const award = awards[currentIndex] || awards[0]
    return {
      ...award,
      count: award.count,
      remaining_count: award.remaining_count,
      draw_count: award.draw_count || 1
    }
  }
}

// 默认导出所有工具函数
export default {
  awardUtils,
  participantUtils,
  winnerUtils,
  lotteryUtils,
  dataUtils,
  soundUtils,
  screenUtils,
  computeUtils
}