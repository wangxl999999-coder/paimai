<template>
  <div class="container">
    <div class="page-header">
      <h2 class="page-title">订单管理</h2>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="订单号">
          <el-input v-model="filter.orderNo" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filter.type" placeholder="全部类型" clearable>
            <el-option label="竞价拍卖" value="auction" />
            <el-option label="一口价" value="fixed" />
            <el-option label="阶梯拼团" value="group" />
            <el-option label="秒杀活动" value="seckill" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部状态" clearable>
            <el-option label="待付款" value="pending" />
            <el-option label="已付款" value="paid" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
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
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table :data="list" stripe border style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="订单ID" width="80" />
        <el-table-column prop="orderNo" label="订单号" width="140" />
        <el-table-column prop="goodsTitle" label="商品" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="buyer" label="买家" width="120">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="28" :src="row.buyer?.avatar" />
              <span>{{ row.buyer?.nickname }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="seller" label="卖家" width="120">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="28" :src="row.seller?.avatar" />
              <span>{{ row.seller?.nickname }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="['status-tag', getStatusClass(row.status)]">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button 
              v-if="row.status === 'paid'" 
              type="success" 
              link 
              @click="markShipped(row)"
            >
              发货
            </el-button>
          </template>
        </el-table-column>
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

    <el-dialog v-model="detailVisible" title="订单详情" width="600px">
      <div v-if="currentOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="订单类型">{{ getTypeText(currentOrder.type) }}</el-descriptions-item>
          <el-descriptions-item label="商品名称" :span="2">{{ currentOrder.goodsTitle }}</el-descriptions-item>
          <el-descriptions-item label="交易金额">¥{{ currentOrder.amount }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <span :class="['status-tag', getStatusClass(currentOrder.status)]">
              {{ getStatusText(currentOrder.status) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="买家">{{ currentOrder.buyer?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="卖家">{{ currentOrder.seller?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDate(currentOrder.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ currentOrder.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="物流信息" :span="2">{{ currentOrder.express || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import request from '@/utils/request'

const loading = ref(false)
const detailVisible = ref(false)
const currentOrder = ref(null)

const filter = reactive({
  orderNo: '',
  type: '',
  status: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const list = ref([])

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
    const res = await request.get('/admin/orders', { params })
    list.value = res.list || []
    pagination.total = res.total || 0
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filter.orderNo = ''
  filter.type = ''
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

const getTypeText = (type) => {
  const map = { auction: '竞价拍卖', fixed: '一口价', group: '阶梯拼团', seckill: '秒杀活动' }
  return map[type] || type
}

const getTypeTag = (type) => {
  const map = { auction: 'danger', fixed: 'primary', group: 'success', seckill: 'warning' }
  return map[type] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { pending: 'warning', paid: 'info', shipped: 'primary', completed: 'success', cancelled: 'danger' }
  return map[status] || 'info'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const viewDetail = (row) => {
  currentOrder.value = row
  detailVisible.value = true
}

const markShipped = async (row) => {
  try {
    await ElMessageBox.prompt('请输入物流单号', '发货', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入物流单号'
    })
    await request.post('/admin/orders/ship', { id: row.id })
    ElMessage.success('发货成功')
    loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped lang="scss">
.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
