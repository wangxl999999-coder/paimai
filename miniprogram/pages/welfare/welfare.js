const app = getApp();

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    this.loadList();
  },

  onPullDownRefresh() {
    this.loadList(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadList();
    }
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
        type: 'auction'
      }
    }).then(res => {
      const list = res.list
        .filter(item => item.isWelfare)
        .map(item => ({
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
  }
});
