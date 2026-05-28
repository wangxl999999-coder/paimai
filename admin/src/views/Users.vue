<template>
  <div class="container">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="关键词">
          <el-input v-model="filter.keyword" placeholder="手机号/昵称" clearable />
        </el-form-item>
        <el-form-item label="身份">
          <el-select v-model="filter.role" placeholder="全部" clearable>
            <el-option label="普通用户" value="user" />
            <el-option label="商家" value="seller" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部" clearable>
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
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
              <el-avatar :size="36" :src="row.avatar" />
              <div class="user-info">
                <div class="username">{{ row.nickname }}</div>
                <div class="phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="storeName" label="店铺名称" width="140" />
        <el-table-column prop="role" label="身份" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleTag(row.role)" size="small">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="goodsCount" label="商品数" width="80" />
        <el-table-column prop="fansCount" label="粉丝数" width="80" />
        <el-table-column prop="totalSales" label="销售额" width="100">
          <template #default="{ row }">¥{{ row.totalSales || 0 }}</template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="100">
          <template #default="{ row }">¥{{ row.balance || 0 }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="disabled"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button 
              v-if="row.role === 'user'" 
              type="success" 
              link 
              @click="upgradeToSeller(row)"
            >
              升级商家
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

    <el-dialog v-model="detailVisible" title="用户详情" width="600px">
      <div v-if="currentUser">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ currentUser.nickname }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
          <el-descriptions-item label="微信OpenID">{{ currentUser.openid || '-' }}</el-descriptions-item>
          <el-descriptions-item label="店铺名称">{{ currentUser.storeName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="身份">{{ getRoleText(currentUser.role) }}</el-descriptions-item>
          <el-descriptions-item label="余额">¥{{ currentUser.balance || 0 }}</el-descriptions-item>
          <el-descriptions-item label="佣金">¥{{ currentUser.commission || 0 }}</el-descriptions-item>
          <el-descriptions-item label="商品数">{{ currentUser.goodsCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="粉丝数">{{ currentUser.fansCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="关注数">{{ currentUser.followCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="注册时间" :span="2">{{ formatDate(currentUser.createdAt) }}</el-descriptions-item>
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
const currentUser = ref(null)

const filter = reactive({
  keyword: '',
  role: '',
  status: ''
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
    const res = await request.get('/admin/users', {
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
  filter.keyword = ''
  filter.role = ''
  filter.status = ''
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

const getRoleText = (role) => {
  const map = { user: '普通用户', seller: '商家', admin: '管理员' }
  return map[role] || role
}

const getRoleTag = (role) => {
  const map = { user: '', seller: 'success', admin: 'danger' }
  return map[role] || 'info'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const toggleStatus = async (row) => {
  try {
    await request.post('/admin/users/status', {
      id: row.id,
      status: row.status
    })
    ElMessage.success(row.status === 'active' ? '已启用' : '已禁用')
  } catch (error) {
    row.status = row.status === 'active' ? 'disabled' : 'active'
  }
}

const viewDetail = (row) => {
  currentUser.value = row
  detailVisible.value = true
}

const upgradeToSeller = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定将用户 "${row.nickname}" 升级为商家吗？`,
      '升级商家',
      { type: 'warning' }
    )
    await request.post('/admin/users/upgrade', { id: row.id })
    ElMessage.success('升级成功')
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
  gap: 12px;
}

.user-info {
  .username {
    font-weight: 500;
    color: #303133;
  }
  .phone {
    font-size: 12px;
    color: #909399;
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
