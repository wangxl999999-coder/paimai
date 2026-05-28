<template>
  <div class="container">
    <div class="page-header">
      <h2 class="page-title">佣金列表</h2>
      <div class="stats-summary">
        <span>累计佣金：<b>¥{{ stats.totalAmount || 0 }}</b></span>
        <span>已结算：<b class="text-success">¥{{ stats.settledAmount || 0 }}</b></span>
        <span>待生效：<b class="text-warning">¥{{ stats.pendingAmount || 0 }}</b></span>
      </div>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="用户">
          <el-input v-model="filter.userKeyword" placeholder="昵称/手机号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部状态" clearable>
            <el-option label="可提现" value="available" />
            <el-option label="待生效" value="pending" />
            <el-option label="已结算" value="settled" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="filter.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
          <el-button type="success" @click="exportData">导出</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table :data="list" stripe border style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="用户" width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" :src="row.user?.avatar" />
              <div>
                <div class="username">{{ row.user?.nickname }}</div>
                <div class="phone">{{ row.user?.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="佣金金额" width="120">
          <template #default="{ row }">
            <span class="text-primary">+¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="层级" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.level === 1 ? 'primary' : 'success'">
              {{ row.level === 1 ? '一级' : '二级' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="goodsTitle" label="来源商品" show-overflow-tooltip />
        <el-table-column label="来源用户" width="120">
          <template #default="{ row }">
            <div v-if="row.fromUser">
              <el-avatar :size="24" :src="row.fromUser.avatar" style="vertical-align: middle; margin-right: 8px;" />
              {{ row.fromUser.nickname }}
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="关联订单" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="['status-tag', getStatusClass(row.status)]">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="settleTime" label="结算时间" width="160">
          <template #default="{ row }">
            {{ row.settleTime ? formatDate(row.settleTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import request from '@/utils/request'

const loading = ref(false)
const stats = ref({})

const filter = reactive({
  userKeyword: '',
  status: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const list = ref([])

const loadStats = async () => {
  const res = await request.get('/admin/commissions/stats')
  stats.value = res
}

const loadList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filter
    }
    if (filter.dateRange?.length === 2) {
      params.startDate = filter.dateRange[0]
      params.endDate = filter.dateRange[1]
    }
    const res = await request.get('/admin/commissions', { params })
    list.value = res.list || []
    pagination.total = res.total || 0
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filter.userKeyword = ''
  filter.status = ''
  filter.dateRange = []
  pagination.page = 1
  loadList()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadList()
}

const getStatusText = (status) => {
  const map = { available: '可提现', pending: '待生效', settled: '已结算', cancelled: '已取消' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { available: 'success', pending: 'warning', settled: 'info', cancelled: 'danger' }
  return map[status] || 'info'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const exportData = () => {
  window.open(`/api/admin/commissions/export?status=${filter.status}`)
}

onMounted(() => {
  loadStats()
  loadList()
})
</script>

<style scoped lang="scss">
.stats-summary {
  display: flex;
  gap: 30px;
  font-size: 14px;
  color: #606266;
  
  b {
    font-size: 18px;
    margin-left: 4px;
    color: #303133;
  }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-size: 14px;
  color: #303133;
}

.phone {
  font-size: 12px;
  color: #909399;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
