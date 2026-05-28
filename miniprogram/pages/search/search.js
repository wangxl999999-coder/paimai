const app = getApp();

Page({
  data: {
    keyword: '',
    history: [],
    hotKeywords: ['手机', '电脑', '运动鞋', '包包', '化妆品', '收藏品'],
    list: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    searched: false
  },

  onLoad() {
    const history = wx.getStorageSync('searchHistory') || [];
    this.setData({ history });
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  search() {
    const keyword = this.data.keyword.trim();
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }
    let history = [keyword, ...this.data.history.filter(k => k !== keyword)].slice(0, 10);
    this.setData({ history, searched: true, page: 1, hasMore: true, list: [] });
    wx.setStorageSync('searchHistory', history);
    this.loadList();
  },

  searchKeyword(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword });
    this.search();
  },

  clearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清空搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ history: [] });
          wx.removeStorageSync('searchHistory');
        }
      }
    });
  },

  loadList(refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const page = refresh ? 1 : this.data.page;
    app.request({
      url: '/goods/list',
      data: {
        page,
        pageSize: this.data.pageSize,
        keyword: this.data.keyword
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
      this.startCountdown();
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  startCountdown() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = setInterval(() => {
      const list = this.data.list.map(item => {
        if (item.endTime) {
          return { ...item, countdown: app.countdown(item.endTime) };
        }
        return item;
      });
      this.setData({ list });
    }, 1000);
  },

  onUnload() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading && this.data.searched) {
      this.loadList();
    }
  },

  onPullDownRefresh() {
    if (this.data.searched) {
      this.loadList(true);
    }
    wx.stopPullDownRefresh();
  }
});
