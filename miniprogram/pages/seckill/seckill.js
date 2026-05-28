const app = getApp();

Page({
  data: {
    goodsId: '',
    goods: {},
    countdown: { hours: '00', minutes: '00', seconds: '00' },
    soldCount: 0,
    stockCount: 0,
    soldPercent: 0,
    discount: 0,
    timer: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ goodsId: options.id });
      this.loadGoodsDetail();
      this.startCountdown();
    }
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  loadGoodsDetail() {
    wx.showLoading({ title: '加载中...' });
    app.request({
      url: '/goods/detail',
      data: { id: this.data.goodsId }
    }).then(res => {
      wx.hideLoading();
      const discount = ((res.seckillPrice / res.originalPrice) * 10).toFixed(1);
      const soldCount = res.soldCount || 0;
      const stockCount = (res.stock || 0) - soldCount;
      const soldPercent = res.stock ? Math.min((soldCount / res.stock) * 100, 100) : 0;

      this.setData({
        goods: res,
        discount,
        soldCount,
        stockCount,
        soldPercent: soldPercent.toFixed(0)
      });
    }).catch(() => {
      wx.hideLoading();
    });
  },

  startCountdown() {
    const updateCountdown = () => {
      const endTime = new Date(this.data.goods.endTime).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        clearInterval(this.data.timer);
        this.setData({
          countdown: { hours: '00', minutes: '00', seconds: '00' }
        });
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      this.setData({
        countdown: {
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0')
        }
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    this.setData({ timer });
  },

  buyNow() {
    if (this.data.stockCount <= 0) {
      wx.showToast({ title: '已抢光', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认购买',
      content: `秒杀价 ¥${this.data.goods.seckillPrice}`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '抢购中...' });
          app.request({
            url: '/seckill/buy',
            method: 'POST',
            data: { goodsId: this.data.goodsId }
          }).then(() => {
            wx.hideLoading();
            wx.showToast({ title: '抢购成功' });
            setTimeout(() => {
              wx.redirectTo({
                url: `/pages/participated/participated?tab=joined`
              });
            }, 1500);
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: err.message || '抢购失败', icon: 'none' });
          });
        }
      }
    });
  }
});
