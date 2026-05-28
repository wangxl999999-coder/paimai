const app = getApp();

Page({
  data: {
    storeId: '',
    store: null,
    tabs: [
      { id: 'all', name: '全部商品' },
      { id: 'auction', name: '竞价拍卖' },
      { id: 'fixed', name: '一口价' },
      { id: 'group', name: '拼团' },
      { id: 'seckill', name: '秒杀' }
    ],
    activeTab: 'all',
    goodsList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    isSubscribed: false
  },

  onLoad(options) {
    this.storeId = options.id;
    this.loadStoreInfo();
    this.loadGoodsList();
  },

  onShow() {
    if (this.storeId) {
      this.loadStoreInfo();
    }
  },

  onPullDownRefresh() {
    this.loadStoreInfo();
    this.loadGoodsList(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadGoodsList();
    }
  },

  loadStoreInfo() {
    app.request({
      url: '/user/info',
      data: { userId: this.storeId }
    }).then(res => {
      this.setData({ store: res });
      wx.setNavigationBarTitle({ title: res.storeName || res.nickname + '的店铺' });
      this.checkSubscribe();
    });
  },

  checkSubscribe() {
    if (!app.globalData.token) return;
    app.request({
      url: '/user/subscriptions'
    }).then(res => {
      const isSubscribed = res.list.some(s => s.id === Number(this.storeId));
      this.setData({ isSubscribed });
    });
  },

  loadGoodsList(refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const page = refresh ? 1 : this.data.page;
    const type = this.data.activeTab === 'all' ? '' : this.data.activeTab;
    app.request({
      url: '/goods/list',
      data: {
        page,
        pageSize: this.data.pageSize,
        type,
        sellerId: this.storeId
      }
    }).then(res => {
      const list = res.list.map(item => ({
        ...item,
        countdown: item.endTime ? app.countdown(item.endTime) : null,
        priceText: app.formatPrice(item.currentPrice || item.price)
      }));
      this.setData({
        goodsList: refresh ? list : [...this.data.goodsList, ...list],
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
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      const goodsList = this.data.goodsList.map(item => {
        if (item.endTime) {
          return { ...item, countdown: app.countdown(item.endTime) };
        }
        return item;
      });
      this.setData({ goodsList });
    }, 1000);
  },

  onUnload() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  },

  switchTab(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activeTab: id, page: 1, hasMore: true, goodsList: [] });
    this.loadGoodsList();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  toggleSubscribe() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    const action = this.data.isSubscribed ? 'unsubscribe' : 'subscribe';
    app.request({
      url: `/user/${action}`,
      method: 'POST',
      data: { publisherId: this.storeId }
    }).then(() => {
      this.setData({ isSubscribed: !this.data.isSubscribed });
      wx.showToast({ title: this.data.isSubscribed ? '已订阅' : '已取消订阅' });
    });
  },

  onShareAppMessage() {
    const store = this.data.store;
    const userId = app.globalData.userInfo?.id;
    return {
      title: `${store?.nickname || '我'}的店铺，好物多多！`,
      path: `/pages/store/store?id=${this.storeId}&shareBy=${userId}`,
      imageUrl: store?.avatar
    };
  }
});
