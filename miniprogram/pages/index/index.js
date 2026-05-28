const app = getApp();

Page({
  data: {
    banners: [
      { id: 1, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=auction%20banner%20promotion&image_size=landscape_16_9', link: '' },
      { id: 2, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flash%20sale%20banner&image_size=landscape_16_9', link: '' }
    ],
    categories: [
      { id: 'auction', name: '竞价拍卖', icon: '🔨', color: '#fff0e8' },
      { id: 'fixed', name: '一口价', icon: '💰', color: '#e8f5e9' },
      { id: 'group', name: '阶梯拼团', icon: '👥', color: '#e3f2fd' },
      { id: 'seckill', name: '秒杀活动', icon: '⚡', color: '#ffebee' }
    ],
    tabs: [
      { id: 'all', name: '全部' },
      { id: 'auction', name: '竞价' },
      { id: 'fixed', name: '一口价' },
      { id: 'group', name: '拼团' },
      { id: 'seckill', name: '秒杀' }
    ],
    activeTab: 'all',
    goodsList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadGoodsList();
  },

  onShow() {
    if (this.data.goodsList.length > 0) {
      this.loadGoodsList(true);
    }
  },

  onPullDownRefresh() {
    this.loadGoodsList(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadGoodsList();
    }
  },

  loadGoodsList(refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const page = refresh ? 1 : this.data.page;
    app.request({
      url: '/goods/list',
      data: {
        page,
        pageSize: this.data.pageSize,
        type: this.data.activeTab === 'all' ? '' : this.data.activeTab
      }
    }).then(res => {
      const list = res.list.map(item => ({
        ...item,
        countdown: app.countdown(item.endTime),
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
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    this.countdownTimer = setInterval(() => {
      const goodsList = this.data.goodsList.map(item => {
        if (item.endTime) {
          return {
            ...item,
            countdown: app.countdown(item.endTime)
          };
        }
        return item;
      });
      this.setData({ goodsList });
    }, 1000);
  },

  onUnload() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  },

  switchTab(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activeTab: id, page: 1, hasMore: true });
    this.loadGoodsList(true);
  },

  goCategory(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activeTab: id, page: 1, hasMore: true });
    this.loadGoodsList(true);
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  goSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  goStore(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/store/store?id=${id}`
    });
  },

  onBannerClick(e) {
    const link = e.currentTarget.dataset.link;
    if (link) {
      wx.navigateTo({
        url: link
      });
    }
  }
});
