<template>
  <div class="container">
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card primary">
          <div class="label">总用户数</div>
          <div class="value">{{ stats.totalUsers || 0 }}</div>
          <div class="trend text-success">↑ 今日新增 {{ stats.todayUsers || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card success">
          <div class="label">总订单数</div>
          <div class="value">{{ stats.totalOrders || 0 }}</div>
          <div class="trend text-success">↑ 今日 {{ stats.todayOrders || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card warning">
          <div class="label">总交易额</div>
          <div class="value">¥{{ stats.totalAmount || 0 }}</div>
          <div class="trend text-success">↑ 今日 ¥{{ stats.todayAmount || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card danger">
          <div class="label">待审核</div>
          <div class="value">{{ stats.pendingWithdraws || 0 }}</div>
          <div class="trend text-danger">待处理提现</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">近7日数据趋势</span>
            <el-radio-group v-model="chartType" size="small" @change="updateChart">
              <el-radio-button label="amount">交易额</el-radio-button>
              <el-radio-button label="orders">订单量</el-radio-button>
              <el-radio-button label="users">新增用户</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="chartRef" class="chart-body"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-title">商品类型分布</span>
          </div>
          <div ref="pieChartRef" class="chart-body pie-chart"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <div class="table-card">
          <div class="table-header">
            <span class="table-title">最新订单</span>
            <el-button type="text" @click="goToOrders">查看全部</el-button>
          </div>
          <el-table :data="recentOrders" stripe style="width: 100%">
            <el-table-column prop="id" label="订单号" width="120" />
            <el-table-column prop="goodsTitle" label="商品" show-overflow-tooltip />
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <span :class="['status-tag', getStatusClass(row.status)]">
                  {{ getStatusText(row.status) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="table-card">
          <div class="table-header">
            <span class="table-title">热卖商品</span>
          </div>
          <el-table :data="hotGoods" stripe style="width: 100%">
            <el-table-column prop="rank" label="排名" width="60">
              <template #default="{ $index }">
                <span :class="['rank', $index < 3 ? 'top' : '']">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="商品" show-overflow-tooltip />
            <el-table-column prop="sales" label="销量" width="80" />
            <el-table-column prop="amount" label="销售额" width="100">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import request from '@/utils/request'

const router = useRouter()
const chartRef = ref()
const pieChartRef = ref()
let chart = null
let pieChart = null
const chartType = ref('amount')

const stats = ref({})
const recentOrders = ref([])
const hotGoods = ref([])

const loadStats = async () => {
  const res = await request.get('/admin/stats')
  stats.value = res
}

const loadRecentOrders = async () => {
  const res = await request.get('/admin/orders', { params: { page: 1, pageSize: 5 } })
  recentOrders.value = res.list || []
}

const loadHotGoods = async () => {
  const res = await request.get('/admin/goods/hot', { params: { limit: 5 } })
  hotGoods.value = res.list || []
}

const updateChart = () => {
  if (!chart) return
  
  const dates = []
  const data = []
  for (let i = 6; i >= 0; i--) {
    dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
    data.push(Math.floor(Math.random() * 5000) + 1000)
  }
  
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: dates },
    yAxis: { type: 'value' },
    series: [{
      name: chartType.value === 'amount' ? '交易额' : chartType.value === 'orders' ? '订单量' : '新增用户',
      type: 'line',
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255, 107, 53, 0.3)' },
          { offset: 1, color: 'rgba(255, 107, 53, 0.05)' }
        ])
      },
      lineStyle: { color: '#ff6b35', width: 2 },
      itemStyle: { color: '#ff6b35' },
      data
    }]
  }
  
  chart.setOption(option)
}

const initPieChart = () => {
  if (!pieChartRef.value) return
  pieChart = echarts.init(pieChartRef.value)
  
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: 35, name: '竞价拍卖', itemStyle: { color: '#ff6b35' } },
        { value: 30, name: '一口价', itemStyle: { color: '#409eff' } },
        { value: 20, name: '阶梯拼团', itemStyle: { color: '#67c23a' } },
        { value: 15, name: '秒杀活动', itemStyle: { color: '#f56c6c' } }
      ]
    }]
  }
  
  pieChart.setOption(option)
}

const getStatusText = (status) => {
  const map = { pending: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { pending: 'warning', paid: 'info', shipped: 'primary', completed: 'success', cancelled: 'danger' }
  return map[status] || 'info'
}

const goToOrders = () => {
  router.push('/orders')
}

onMounted(async () => {
  await Promise.all([loadStats(), loadRecentOrders(), loadHotGoods()])
  await nextTick()
  chart = echarts.init(chartRef.value)
  updateChart()
  initPieChart()
  
  window.addEventListener('resize', () => {
    chart?.resize()
    pieChart?.resize()
  })
})
</script>

<style scoped lang="scss">
.stat-row {
  margin-bottom: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  height: 400px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-body {
  flex: 1;
}

.pie-chart {
  height: 280px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.rank {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background: #f0f0f0;
  border-radius: 50%;
  font-size: 12px;
}

.rank.top {
  background: #ff6b35;
  color: #fff;
}
</style>
