<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon size="28"><Platform /></el-icon>
        <span>拍卖平台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        @select="handleMenuSelect"
        background-color="#001529"
        text-color="#fff"
        active-text-color="#ff6b35"
      >
        <el-menu-item 
          v-for="item in menuItems" 
          :key="item.path"
          :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleCommand">
            <span class="dropdown-trigger">
              <el-avatar :size="32" :src="authStore.userInfo?.avatar" />
              <span class="username">{{ authStore.userInfo?.username }}</span>
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')

const menuItems = [
  { path: '/dashboard', title: '数据看板', icon: 'Odometer' },
  { path: '/orders', title: '订单管理', icon: 'List' },
  { path: '/users', title: '用户管理', icon: 'User' },
  { path: '/commissions', title: '佣金列表', icon: 'Money' },
  { path: '/withdraws', title: '提现审核', icon: 'Wallet' },
  { path: '/faqs', title: 'FAQ维护', icon: 'QuestionFilled' },
  { path: '/goods', title: '商品列表', icon: 'Goods' }
]

const handleMenuSelect = (path) => {
  router.push(path)
}

const handleCommand = (command) => {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  height: 100vh;
}

.sidebar {
  background: #001529;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  gap: 10px;
  border-bottom: 1px solid #1f3b53;
}

.menu {
  flex: 1;
  border-right: none;
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  
  .dropdown-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    
    .username {
      color: #666;
    }
  }
}

.main {
  padding: 0;
  background: #f5f7fa;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
