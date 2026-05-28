<template>
  <div class="container">
    <div class="page-header">
      <h2 class="page-title">商品列表</h2>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="商家">
          <el-input v-model="filter.sellerKeyword" placeholder="商家昵称" clearable />
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
            <el-option label="进行中" value="active" />
            <el-option label="已结束" value="ended" />
            <el-option label="已下架" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filter.keyword" placeholder="商品名称" clearable />
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
        <el-table-column label="商品" width="280">
          <template #default="{ row }">
            <div class="goods-cell">
              <el-image :src="row.images?.[0]" style="width: 60px; height: 60px; border-radius: 4px;" />
              <div class="goods-info">
                <div class="goods-title">{{ row.title }}</div>
                <div class="goods-meta">
                  <el-tag :type="getTypeTag(row.type)" size="small">
                    {{ getTypeText(row.type) }}
                  </el-tag>
                  <el-tag v-if="row.isWelfare" type="danger" size="small">福利</el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商家" width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="28" :src="row.seller?.avatar" />
              <span>{{ row.seller?.nickname }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            <div>¥{{ row.currentPrice || row.price }}</div>
            <div class="original-price" v-if="row.originalPrice">
              ¥{{ row.originalPrice }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存/已售" width="120">
          <template #default="{ row }">
            {{ row.soldCount || 0 }} / {{ row.stock || '不限' }}
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览" width="80" />
        <el-table-column prop="bidCount" label="出价/参团" width="100">
          <template #default="{ row }">
            {{ row.bidCount || row.groupCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span :class="['status-tag', getStatusClass(row.status)]">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发布时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button 
              v-if="row.status !== 'offline'"
              type="danger" 
              link 
              @click="offlineGoods(row)"
            >
              下架
            </el-button>
            <el-button 
              v-if="row.status === 'offline'"
              type="success" 
              link 
              @click="onlineGoods(row)"
            >
              上架
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

    <el-dialog v-model="detailVisible" title="商品详情" width="700px">
      <div v-if="currentGoods">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="商品名称" :span="2">{{ currentGoods.title }}</el-descriptions-item>
          <el-descriptions-item label="商品类型">{{ getTypeText(currentGoods.type) }}</el-descriptions-item>
          <el-descriptions-item label="价格">¥{{ currentGoods.currentPrice || currentGoods.price }}</el-descriptions-item>
          <el-descriptions-item label="原价" v-if="currentGoods.originalPrice">¥{{ currentGoods.originalPrice }}</el-descriptions-item>
          <el-descriptions-item label="起拍价" v-if="currentGoods.startPrice">¥{{ currentGoods.startPrice }}</el-descriptions-item>
          <el-descriptions-item label="加价幅度" v-if="currentGoods.increment">¥{{ currentGoods.increment }}</el-descriptions-item>
          <el-descriptions-item label="库存">{{ currentGoods.stock || '不限' }}</el-descriptions-item>
          <el-descriptions-item label="已售">{{ currentGoods.soldCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="浏览次数">{{ currentGoods.viewCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="出价次数">{{ currentGoods.bidCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="是否福利">{{ currentGoods.isWelfare ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="发布时间" :span="2">{{ formatDate(currentGoods.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="商品描述" :span="2">{{ currentGoods.description }}</el-descriptions-item>
          <el-descriptions-item label="商品图片" :span="2">
            <el-image
              v-for="(img, idx) in currentGoods.images"
              :key="idx"
              :src="img"
              style="width: 100px; height: 100px; margin-right: 10px;"
              :preview-src-list="currentGoods.images"
            />
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
const currentGoods = ref(null)

const filter = reactive({
  sellerKeyword: '',
  type: '',
  status: '',
  keyword: ''
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
    const res = await request.get('/admin/goods', {
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
  filter.sellerKeyword = ''
  filter.type = ''
  filter.status = ''
  filter.keyword = ''
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
  const map = { active: '进行中', ended: '已结束', offline: '已下架' }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = { active: 'success', ended: 'info', offline: 'danger' }
  return map[status] || 'info'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const viewDetail = (row) => {
  currentGoods.value = row
  detailVisible.value = true
}

const offlineGoods = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要下架商品 "${row.title}" 吗？`,
      '下架确认',
      { type: 'warning' }
    )
    await request.post('/admin/goods/offline', { id: row.id })
    ElMessage.success('已下架')
    loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const onlineGoods = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要上架商品 "${row.title}" 吗？`,
      '上架确认',
      { type: 'warning' }
    )
    await request.post('/admin/goods/online', { id: row.id })
    ElMessage.success('已上架')
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
.goods-cell {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.goods-info {
  flex: 1;
  min-width: 0;
}

.goods-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 6px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.goods-meta {
  display: flex;
  gap: 6px;
}

.original-price {
  font-size: 12px;
  color: #909399;
  text-decoration: line-through;
}

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
