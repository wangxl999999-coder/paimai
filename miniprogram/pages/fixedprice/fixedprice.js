const app = getApp();

Page({
  data: {
    goodsId: '',
    goods: {},
    store: {},
    specs: [],
    selectedSpecIndex: 0,
    quantity: 1
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ goodsId: options.id });
      this.loadGoodsDetail();
    }
  },

  loadGoodsDetail() {
    wx.showLoading({ title: '加载中...' });
    app.request({
      url: '/goods/detail',
      data: { id: this.data.goodsId }
    }).then(res => {
      wx.hideLoading();
      const specs = res.specs || [{ name: '默认' }];
      this.setData({
        goods: res,
        specs,
        store: {
          id: res.sellerId,
          name: res.storeName || res.sellerName,
          avatar: res.sellerAvatar,
          fansCount: res.fansCount || 0,
          goodsCount: res.goodsCount || 0
        }
      });
    }).catch(() => {
      wx.hideLoading();
    });
  },

  selectSpec(e) {
    this.setData({ selectedSpecIndex: e.currentTarget.dataset.index });
  },

  decreaseQty() {
    if (this.data.quantity > 1) {
      this.setData({ quantity: this.data.quantity - 1 });
    }
  },

  increaseQty() {
    this.setData({ quantity: this.data.quantity + 1 });
  },

  goToStore() {
    wx.navigateTo({
      url: `/pages/store/store?id=${this.data.store.id}`
    });
  },

  contactSeller() {
    wx.showToast({ title: '联系客服功能开发中', icon: 'none' });
  },

  addToCart() {
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  },

  buyNow() {
    const spec = this.data.specs[this.data.selectedSpecIndex];
    wx.showModal({
      title: '确认购买',
      content: `${spec.name} x ${this.data.quantity}，总价 ¥${(this.data.goods.price * this.data.quantity).toFixed(2)}`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '提交中...' });
          app.request({
            url: '/order/create',
            method: 'POST',
            data: {
              goodsId: this.data.goodsId,
              quantity: this.data.quantity,
              spec: spec.name
            }
          }).then(() => {
            wx.hideLoading();
            wx.showToast({ title: '下单成功' });
            setTimeout(() => {
              wx.redirectTo({
                url: `/pages/participated/participated?tab=joined`
              });
            }, 1500);
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: err.message || '下单失败', icon: 'none' });
          });
        }
      }
    });
  }
});
