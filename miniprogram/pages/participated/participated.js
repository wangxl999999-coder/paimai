const app = getApp();

Page({
  data: {
    tabs: [
      { id: 'published', name: '我发布的' },
      { id: 'joined', name: '我参与的' },
      { id: 'purchased', name: '我买到的' },
      { id: 'sold', name: '我卖出的' }
    ],
    activeTab: 'published',
    currentTabName: '我发布的',
    list: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad(options) {
    if (options.tab) {
      const tab = this.data.tabs.find(t => t.id === options.tab);
      this.setData({ activeTab: options.tab, currentTabName: tab ? tab.name : '我发布的' });
    }
    this.loadList();
  },

  onShow() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    if (this.data.list.length > 0) {
      this.loadList(true);
    }
  },

  onPullDownRefresh() {
    this.loadList(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadList();
    }
  },

  switchTab(e) {
    const id = e.currentTarget.dataset.id;
    const tab = this.data.tabs.find(t => t.id === id);
    this.setData({ 
      activeTab: id, 
      currentTabName: tab ? tab.name : '', 
      page: 1, 
      hasMore: true, 
      list: [] 
    });
    this.loadList();
  },

  loadList(refresh = false) {
    if (this.data.loading) return;
    if (!app.globalData.token) return;
    this.setData({ loading: true });
    const page = refresh ? 1 : this.data.page;
    const typeMap = {
      published: 'published',
      joined: 'joined',
      purchased: 'purchased',
      sold: 'sold'
    };
    app.request({
      url: '/user/orders',
      data: {
        page,
        pageSize: this.data.pageSize,
        type: typeMap[this.data.activeTab]
      }
    }).then(res => {
      const list = res.list.map(item => ({
        ...item,
        countdown: item.endTime ? app.countdown(item.endTime) : null,
        priceText: app.formatPrice(item.currentPrice || item.price)
      }));
      this.setData({
        list: refresh ? list : [...this.data.list, ...list],
        page: page + 1,
        hasMore: res.list.length >= this.data.pageSize,
        loading: false
      });
      if (refresh) {
        wx.stopPullDownRefresh();
      }
      this.startCountdown();
    }).catch(() => {
      this.setData({ loading: false });
      if (refresh) {
        wx.stopPullDownRefresh();
      }
    });
  },

  startCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    this.countdownTimer = setInterval(() => {
      const list = this.data.list.map(item => {
        if (item.endTime && item.status !== 'ended') {
          return {
            ...item,
            countdown: app.countdown(item.endTime)
          };
        }
        return item;
      });
      this.setData({ list });
    }, 1000);
  },

  onUnload() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  handleOrder(e) {
    const action = e.currentTarget.dataset.action;
    const id = e.currentTarget.dataset.id;
    if (action === 'ship') {
      wx.showModal({
        title: '发货',
        content: '确认已发货？',
        success: (res) => {
          if (res.confirm) {
            app.request({
              url: '/order/ship',
              method: 'POST',
              data: { orderId: id }
            }).then(() => {
              wx.showToast({ title: '已标记发货' });
              this.loadList(true);
            });
          }
        }
      });
    } else if (action === 'confirm') {
      wx.showModal({
        title: '确认收货',
        content: '确认已收到商品？',
        success: (res) => {
          if (res.confirm) {
            app.request({
              url: '/order/confirm',
              method: 'POST',
              data: { orderId: id }
            }).then(() => {
              wx.showToast({ title: '已确认收货' });
              this.loadList(true);
            });
          }
        }
      });
    } else if (action === 'delete') {
      wx.showModal({
        title: '删除',
        content: '确定要删除此记录吗？',
        success: (res) => {
          if (res.confirm) {
            app.request({
              url: '/order/delete',
              method: 'POST',
              data: { orderId: id }
            }).then(() => {
              wx.showToast({ title: '已删除' });
              this.loadList(true);
            });
          }
        }
      });
    } else if (action === 'offline') {
      wx.showModal({
        title: '下架商品',
        content: '确定要下架此商品吗？',
        success: (res) => {
          if (res.confirm) {
            app.request({
              url: '/goods/offline',
              method: 'POST',
              data: { goodsId: id }
            }).then(() => {
              wx.showToast({ title: '已下架' });
              this.loadList(true);
            });
          }
        }
      });
    }
  },

  payOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '支付',
      content: '模拟支付流程',
      success: (res) => {
        if (res.confirm) {
          app.request({
            url: '/order/pay',
            method: 'POST',
            data: { orderId: id }
          }).then(() => {
            wx.showToast({ title: '支付成功' });
            this.loadList(true);
          });
        }
      }
    });
  }
});
