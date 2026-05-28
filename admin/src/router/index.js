import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layout/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据看板', icon: 'Odometer' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { title: '订单管理', icon: 'List' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'commissions',
        name: 'Commissions',
        component: () => import('@/views/Commissions.vue'),
        meta: { title: '佣金列表', icon: 'Money' }
      },
      {
        path: 'withdraws',
        name: 'Withdraws',
        component: () => import('@/views/Withdraws.vue'),
        meta: { title: '提现审核', icon: 'Wallet' }
      },
      {
        path: 'faqs',
        name: 'Faqs',
        component: () => import('@/views/Faqs.vue'),
        meta: { title: 'FAQ维护', icon: 'QuestionFilled' }
      },
      {
        path: 'goods',
        name: 'Goods',
        component: () => import('@/views/Goods.vue'),
        meta: { title: '商品列表', icon: 'Goods' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  document.title = to.meta.title ? `${to.meta.title} - 拍卖平台管理后台` : '拍卖平台管理后台'
  
  if (to.path === '/login') {
    next()
  } else if (!authStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router
