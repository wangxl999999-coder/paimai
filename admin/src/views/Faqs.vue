<template>
  <div class="container">
    <div class="page-header">
      <h2 class="page-title">FAQ维护</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增FAQ
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="分类">
          <el-select v-model="filter.category" placeholder="全部分类" clearable>
            <el-option 
              v-for="cat in categories" 
              :key="cat" 
              :label="cat" 
              :value="cat" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filter.keyword" placeholder="问题/答案" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部状态" clearable>
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
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
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="question" label="问题" show-overflow-tooltip />
        <el-table-column prop="answer" label="答案" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="viewCount" label="查看数" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑FAQ' : '新增FAQ'" 
      width="600px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类" prop="category">
          <el-select 
            v-model="form.category" 
            placeholder="请选择或输入分类"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option 
              v-for="cat in allCategories" 
              :key="cat" 
              :label="cat" 
              :value="cat" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="问题" prop="question">
          <el-input v-model="form.question" placeholder="请输入问题" />
        </el-form-item>
        <el-form-item label="答案" prop="answer">
          <el-input
            v-model="form.answer"
            type="textarea"
            :rows="4"
            placeholder="请输入答案"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" active-value="active" inactive-value="inactive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import request from '@/utils/request'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref()
const isEdit = ref(false)
const categories = ref([])
const defaultCategories = ['账户相关', '交易流程', '佣金提现', '商品发布', '拍卖规则', '拼团规则', '秒杀规则', '其他']
const allCategories = ref([...defaultCategories])

const filter = reactive({
  category: '',
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const list = ref([])

const form = reactive({
  id: null,
  category: '',
  question: '',
  answer: '',
  sort: 0,
  status: 'active'
})

const rules = {
  category: [{ required: true, message: '请输入分类', trigger: 'blur' }],
  question: [{ required: true, message: '请输入问题', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入答案', trigger: 'blur' }]
}

const loadCategories = async () => {
  try {
    const res = await request.get('/admin/faqs/categories')
    const dbCategories = res.categories || []
    categories.value = dbCategories
    const merged = [...new Set([...defaultCategories, ...dbCategories])]
    allCategories.value = merged
  } catch (e) {
    allCategories.value = [...defaultCategories]
  }
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/faqs', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filter
      }
    })
    list.value = (res.list || []).map(item => ({
      ...item,
      sort: item.sortOrder ?? item.sort ?? 0
    }))
    pagination.total = res.total || 0
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filter.category = ''
  filter.keyword = ''
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

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const toggleStatus = async (row) => {
  try {
    await request.post('/admin/faqs/status', {
      id: row.id,
      status: row.status
    })
    ElMessage.success(row.status === 'active' ? '已启用' : '已禁用')
  } catch (error) {
    row.status = row.status === 'active' ? 'inactive' : 'active'
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.id = null
  form.category = ''
  form.question = ''
  form.answer = ''
  form.sort = 0
  form.status = 'active'
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.id = row.id
  form.category = row.category
  form.question = row.question
  form.answer = row.answer
  form.sort = row.sortOrder ?? row.sort ?? 0
  form.status = row.status
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    if (isEdit.value) {
      await request.post('/admin/faqs/update', form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/admin/faqs/create', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadCategories()
    loadList()
  } catch (error) {
    console.error(error)
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个FAQ吗？',
      '删除确认',
      { type: 'warning' }
    )
    await request.post('/admin/faqs/delete', { id: row.id })
    ElMessage.success('删除成功')
    loadList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

onMounted(() => {
  loadCategories()
  loadList()
})
</script>

<style scoped lang="scss">
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
