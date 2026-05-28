<template>
  <div class="container">
    <div class="page-header">
      <h2 class="page-title">提现审核</h2>
      <div class="stats-summary">
        <span>待审核：<b class="text-warning">{{ stats.pending || 0 }}</b></span>
        <span>今日申请：<b>{{ stats.todayCount || 0 }}</b></span>
        <span>今日金额：<b class="text-primary">¥{{ stats.todayAmount || 0 }}</b></span>
      </div>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="用户">
          <el-input v-model="filter.userKeyword" placeholder="昵称/手机号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已打款" value="paid" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="方式">
          <el-select v-model="filter.type" placeholder="全部方式" clearable>
            <el-option label="微信" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="银行卡" value="bank" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table :data="list" stripe border style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="用户" width="180">
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
        <el-table-column prop="amount" label="提现金额" width="120">
          <template #default="{ row }">
            <span class="text-primary">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fee" label="手续费" width="100">
          <template #default="{ row }">¥{{ row.fee || 0 }}</template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实付金额" width="120">
          <template #default="{ row }">
            <b>¥{{ row.actualAmount || row.amount }}</b>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="提现方式" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="account" label="账号" width="160" show-overflow-tooltip />
        <el-table-column prop="accountName" label="姓名" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="['status-tag', getStatusClass(row.status)]">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'pending'" 
              type="success" 
              size="small"
              @click="approve(row)"
            >
              通过
            </el-button>
            <el-button 
              v-if="row.status === 'pending'" 
              type="danger" 
              size="small"
              @click="reject(row)"
            >
              拒绝
            </el-button>
            <el-button 
              v-if="row.status === 'approved'" 
              type="primary" 
              size="small"
              @click="markPaid(row)"
            >
              已打款
            </el-button>
            <el-button type="info" size="small" @click="viewDetail(row)">详情</el-button>
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

    <el-dialog v-model="detailVisible" title="提现详情" width="500px">
      <div v-if="currentItem">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="申请时间">{{ formatDate(currentItem.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentItem.user?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="提现方式">{{ getTypeText(currentItem.type) }}</el-descriptions-item>
          <el-descriptions-item label="提现账号">{{ currentItem.account }}</el-descriptions-item>
          <el-descriptions-item label="真实姓名">{{ currentItem.accountName }}</el-descriptions-item>
          <el-descriptions-item label="提现金额">¥{{ currentItem.amount }}</el-descriptions-item>
          <el-descriptions-item label="手续费">¥{{ currentItem.fee || 0 }}</el-descriptions-item>
          <el-descriptions-item label="实付金额"><b class="text-primary">¥{{ currentItem.actualAmount || currentItem.amount }}</b></el-descriptions-item>
          <el-descriptions-item label="状态">
            <span :class="['status-tag', getStatusClass(currentItem.status)]">
              {{ getStatusText(currentItem.status) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="审核备注" v-if="currentItem.rejectReason">
            {{ currentItem.rejectReason }}
          </el-descriptions-item>
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
const currentItem = ref(null)
const stats = ref({})

const filter = reactive({
  userKeyword: '',
  status: '',
  type: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const list = ref([])

const loadStats = async () => {
  const res = await request.get('/admin/withdraws/stats')
  stats.value = res
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/withdraws', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filter
      }
    })
    list.value = res.list || []
    pagination.total = res.total || 0
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filter.userKeyword = ''
  filter.status = ''
  filter.type = ''
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
  const map = { wechat: '微信', alipay: '支付宝', bank: '银行卡' }
  return map[type] || type
}

const getStatusText = (status) => {
  const map = { pending: '待审核', approved: '已通过', paid: '已打款', rejected: '已拒绝' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { pending: 'warning', approved: 'info', paid: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const approve = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定通过该提现申请吗？\n提现金额：¥${row.amount}\n实付金额：¥${row.actualAmount || row.amount}`,
      '审核通过',
      { type: 'warning' }
    )
    await request.post('/admin/withdraws/approve', { id: row.id })
    ElMessage.success('已通过')
    loadStats()
    loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const reject = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt(
      '请输入拒绝原因',
      '拒绝申请',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入拒绝原因',
        inputValidator: (value) => {
          if (!value) return '请输入拒绝原因'
          return true
        }
      }
    )
    await request.post('/admin/withdraws/reject', { id: row.id, reason: value })
    ElMessage.success('已拒绝')
    loadStats()
    loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const markPaid = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认已打款 ¥${row.actualAmount || row.amount} 吗？`,
      '确认打款',
      { type: 'warning' }
    )
    await request.post('/admin/withdraws/paid', { id: row.id })
    ElMessage.success('已标记为打款')
    loadStats()
    loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const viewDetail = (row) => {
  currentItem.value = row
  detailVisible.value = true
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
