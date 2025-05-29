import { pa } from 'element-plus/es/locales.mjs'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useParticipantStore = defineStore('participant', () => {
  const participants = ref([])
  const winners = ref([])
  const currentRound = ref(1)

  const availableParticipants = computed(() => {
    return participants.value.filter(p => !p.isWinner)
  })

  const displayNames = computed(() => {
    return availableParticipants.value.map(p => p.name)
  })

  const importParticipants = async (data) => {
    try {
      // const token = localStorage.getItem('token')
      // if (!token) {
      //   throw new Error('用户未登录，请先登录')
      // }

      // 处理数据，确保每个参与者都有必要的字段
      const processedData = data.map(participant => ({
        name: participant.name,
        user_code: participant.user_code,
        department: participant.department,
        weight: participant.weight || 1,
        has_won: false,
        win_count: 0,
        high_award_level: 0
      }))

      const response = await fetch('/api/participants/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(processedData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        // if (response.status === 401) {
        //   localStorage.removeItem('token')
        //   // 触发全局登出事件
        //   window.dispatchEvent(new CustomEvent('auth-failed'))
        //   throw new Error('认证失败，请重新登录')
        // }
        throw new Error(errorData.message || '导入数据库失败')
      }

      const result = await response.json()
      participants.value = result
      return result
    } catch (error) {
      throw error
    }
  }

  const updateParticipant = (participant) => {
    const index = participants.value.findIndex(p => p.id === participant.id)
    if (index !== -1) {
      participants.value[index] = { ...participant }
    }
  }

  const deleteParticipant = (id) => {
    const index = participants.value.findIndex(p => p.id === id)
    if (index !== -1) {
      participants.value.splice(index, 1)
    }
  }

  const drawWinner = (prize) => {
    if (availableParticipants.value.length === 0) {
      return null
    }

    // 计算总权重
    const totalWeight = availableParticipants.value.reduce(
      (sum, p) => sum + calculateFinalWeight(p, prize.level),
      0
    )

    // 随机选择
    let random = Math.random() * totalWeight
    let selectedIndex = -1

    for (let i = 0; i < availableParticipants.value.length; i++) {
      const participant = availableParticipants.value[i]
      const weight = calculateFinalWeight(participant, prize.level)
      random -= weight
      if (random <= 0) {
        selectedIndex = i
        break
      }
    }

    if (selectedIndex === -1) {
      return null
    }

    const winner = availableParticipants.value[selectedIndex]
    winner.isWinner = true
    winner.winCount++
    if (!winner.highestLevel || prize.level < winner.highestLevel) {
      winner.highestLevel = prize.level
    }

    // 记录中奖信息
    const winnerRecord = {
      ...winner,
      prizeId: prize.id,
      round: currentRound.value,
      timestamp: new Date()
    }
    winners.value.push(winnerRecord)

    return winnerRecord
  }

  const calculateFinalWeight = (participant, prizeLevel) => {
    // 基础权重
    let weight = participant.weight

    // 根据历史中奖次数降低权重
    weight = weight / (1 + participant.winCount)

    // 根据奖级别调整权重
    if (participant.highestLevel) {
      const levelDiff = prizeLevel - participant.highestLevel
      if (levelDiff > 0) {
        weight = weight * (1 + levelDiff * 0.2)
      } else {
        weight = weight * (1 - Math.abs(levelDiff) * 0.1)
      }
    }

    return Math.max(0.1, weight)
  }

  const resetAllParticipants = () => {
    participants.value.forEach(p => {
      p.isWinner = false
      p.winCount = 0
      p.highestLevel = null
    })
    winners.value = []
    currentRound.value = 1
  }

  const incrementRound = () => {
    currentRound.value++
  }

  const fetchParticipants = async () => {
    try {
      console.log('开始获取参与者列表...')
      const response = await fetch('/api/participants?limit=1000', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('获取参与者列表失败:', errorData)
        throw new Error(errorData.message || '获取参与者列表失败')
      }

      const result = await response.json()
      console.log('成功获取参与者列表:', result)
      participants.value = result.map(p => {
        const { has_won, win_count, high_award_level, ...rest } = p
        return {
          ...rest,
          isWinner: has_won || false,
          winCount: win_count || 0,
          highestLevel: high_award_level || null
        }
      })
      console.log('处理后的参与者列表:', participants.value) // 打印处理后的参与者列表，用于调试
      return participants.value
    } catch (error) {
      console.error('获取参与者列表出错:', error)
      participants.value = []
      throw error
    }
  }

  return {
    participants,
    winners,
    currentRound,
    availableParticipants,
    displayNames,
    fetchParticipants,
    importParticipants,
    updateParticipant,
    deleteParticipant,
    drawWinner,
    resetAllParticipants,
    incrementRound
  }
})