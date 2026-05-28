const app = getApp();

Page({
  data: {
    categories: [],
    activeCategory: '',
    list: [],
    expandedId: null,
    loading: false
  },

  onLoad() {
    this.loadList();
  },

  onPullDownRefresh() {
    this.loadList();
  },

  loadList() {
    this.setData({ loading: true });
    app.request({
      url: '/faq/list',
      data: { category: this.data.activeCategory }
    }).then(res => {
      this.setData({
        list: res.list,
        categories: ['全部', ...res.categories],
        loading: false
      });
      wx.stopPullDownRefresh();
    }).catch(() => {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    });
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ 
      activeCategory: category === '全部' ? '' : category,
      expandedId: null 
    });
    this.loadList();
  },

  toggleExpand(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      expandedId: this.data.expandedId === id ? null : id
    });
    if (this.data.expandedId !== id) {
      app.request({
        url: '/faq/detail',
        data: { id }
      });
    }
  },

  goContact() {
    wx.navigateTo({ url: '/pages/contact/contact' });
  }
});
