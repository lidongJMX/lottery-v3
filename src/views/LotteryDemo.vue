<template>
  <div class="lottery-demo">
    <AdvancedLotteryRoll
      :participants="participants"
      title="年会抽奖"
      subtitle="2024年度幸运大抽奖"
      @winner-selected="onWinnerSelected"
    />
  </div>
</template>

<script>
import AdvancedLotteryRoll from '@/components/AdvancedLotteryRoll.vue'

export default {
  name: 'LotteryDemo',
  components: {
    AdvancedLotteryRoll
  },
  data() {
    return {
      participants: [
        { name: '张三', department: '技术部' },
        { name: '李四', department: '市场部' },
        { name: '王五', department: '人事部' },
        { name: '赵六', department: '财务部' },
        { name: '钱七', department: '运营部' },
        // ... 更多参与者
      ]
    }
  },
  methods: {
    onWinnerSelected(result) {
      console.log('中奖者:', result)
      // 处理中奖结果
      this.$message.success(`恭喜 ${result.winner} 中奖！`)
    }
  }
}
</script>