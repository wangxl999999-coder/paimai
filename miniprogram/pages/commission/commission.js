const app = getApp();

Page({
  data: {
    tabs: [
      { id: 'all', name: '全部' },
      { id: 'available', name: '可提现' },
      { id: 'pending', name: '待生效' },
      { id: 'settled', name: '已结算' }
    ],
    activeTab: 'all',
    stats: {
      total: 0,
      available: 0,
      pending: 0,
      today: 0
    },
    list: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.loadStats();
    this.loadList();
  },

  onPullDownRefresh() {
    this.loadStats();
    this.loadList(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadList();
    }
  },

  switchTab(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activeTab: id, page: 1, hasMore: true, list: [] });
    this.loadList();
  },

  loadStats() {
    app.request({ url: '/user/stats' }).then(res => {
      this.setData({
        'stats.total': res.commission || 0,
        'stats.available': res.availableCommission || 0,
        'stats.pending': res.frozenCommission || 0
      });
    });
  },

  loadList(refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const page = refresh ? 1 : this.data.page;
    const status = this.data.activeTab === 'all' ? '' : this.data.activeTab;
    app.request({
      url: '/user/commissions',
      data: { page, pageSize: this.data.pageSize, status }
    }).then(res => {
      const list = res.list.map(item => ({
        ...item,
        timeText: app.formatTime(item.createdAt)
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
    }).catch(() => {
      this.setData({ loading: false });
      if (refresh) {
        wx.stopPullDownRefresh();
      }
    });
  },

  goWithdraw() {
    wx.navigateTo({ url: '/pages/withdraw/withdraw' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
