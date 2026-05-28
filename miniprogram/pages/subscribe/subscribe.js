const app = getApp();

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.loadList();
  },

  onShow() {
    if (app.globalData.token) {
      this.loadList(true);
    }
  },

  onPullDownRefresh() {
    this.loadList(true);
  },

  loadList(refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const page = refresh ? 1 : this.data.page;
    app.request({
      url: '/user/subscriptions',
      data: { page, pageSize: this.data.pageSize }
    }).then(res => {
      this.setData({
        list: refresh ? res.list : [...this.data.list, ...res.list],
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

  goStore(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/store/store?id=${id}` });
  },

  unsubscribe(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消订阅',
      content: '确定要取消订阅此店铺吗？',
      success: (res) => {
        if (res.confirm) {
          app.request({
            url: '/user/unsubscribe',
            method: 'POST',
            data: { publisherId: id }
          }).then(() => {
            wx.showToast({ title: '已取消订阅' });
            this.loadList(true);
          });
        }
      }
    });
  }
});
