import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePrizeStore = defineStore('prize', () => {
  const prizes = ref([])
  const currentPrizeIndex = ref(0)

  const currentPrize = computed(() => prizes.value[currentPrizeIndex.value] || {})

  const addPrize = (prize) => {
    const newPrize = {
      id: Date.now(),
      ...prize,
      remaining: prize.total
    }
    prizes.value.push(newPrize)
  }

  const updatePrize = (prize) => {
    const index = prizes.value.findIndex(p => p.id === prize.id)
    if (index !== -1) {
      prizes.value[index] = {
        ...prize,
        remaining: prize.total - (prizes.value[index].total - prizes.value[index].remaining)
      }
    }
  }

  const deletePrize = (id) => {
    const index = prizes.value.findIndex(p => p.id === id)
    if (index !== -1) {
      prizes.value.splice(index, 1)
      if (currentPrizeIndex.value >= prizes.value.length) {
        currentPrizeIndex.value = Math.max(0, prizes.value.length - 1)
      }
    }
  }

  const decreaseRemaining = () => {
    if (currentPrize.value.remaining > 0) {
      currentPrize.value.remaining--
    }
  }

  const resetCurrentPrize = () => {
    if (currentPrize.value) {
      currentPrize.value.remaining = currentPrize.value.total
    }
  }

  const resetAllPrizes = () => {
    prizes.value.forEach(prize => {
      prize.remaining = prize.total
    })
    currentPrizeIndex.value = 0
  }

  const getPrizeName = (id) => {
    const prize = prizes.value.find(p => p.id === id)
    return prize ? prize.name : ''
  }

  const setCurrentPrizeIndex = (index) => {
    if (index >= 0 && index < prizes.value.length) {
      currentPrizeIndex.value = index
    }
  }

  return {
    prizes,
    currentPrize,
    currentPrizeIndex,
    addPrize,
    updatePrize,
    deletePrize,
    decreaseRemaining,
    resetCurrentPrize,
    resetAllPrizes,
    getPrizeName,
    setCurrentPrizeIndex
  }
}) 