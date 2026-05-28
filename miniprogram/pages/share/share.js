const app = getApp();

Page({
  data: {
    goodsId: '',
    goods: {},
    commissionAmount: '0.00',
    inviteCode: '',
    posterImage: ''
  },

  onLoad(options) {
    if (options.goodsId) {
      this.setData({ goodsId: options.goodsId });
      this.loadGoodsDetail();
    }
    this.setData({ inviteCode: app.globalData.userInfo?.id || '000000' });
  },

  loadGoodsDetail() {
    wx.showLoading({ title: '加载中...' });
    app.request({
      url: '/goods/detail',
      data: { id: this.data.goodsId }
    }).then(res => {
      wx.hideLoading();
      this.setData({
        goods: res,
        commissionAmount: (res.price * 0.1).toFixed(2)
      });
      this.generatePoster();
    }).catch(() => {
      wx.hideLoading();
    });
  },

  generatePoster() {
    setTimeout(() => {
      this.setData({
        posterImage: this.data.goods.image
      });
    }, 1000);
  },

  savePoster() {
    if (!this.data.posterImage) {
      wx.showToast({ title: '海报生成中，请稍候', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '保存中...' });
    wx.downloadFile({
      url: this.data.posterImage,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.hideLoading();
            wx.showToast({ title: '保存成功' });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  },

  copyCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => {
        wx.showToast({ title: '复制成功' });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: this.data.goods.title || '快来看看这个好东西',
      path: `/pages/detail/detail?id=${this.data.goodsId}&inviter=${app.globalData.userInfo?.id}`,
      imageUrl: this.data.goods.image
    };
  }
});
