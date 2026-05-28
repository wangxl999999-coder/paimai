const app = getApp();

Page({
  data: {
    goods: null,
    currentImageIndex: 0,
    bidAmount: '',
    countdown: null,
    isSubscribed: false,
    showShare: false,
    shareUrl: '',
    comments: [],
    bidRecords: []
  },

  onLoad(options) {
    this.goodsId = options.id;
    this.loadGoodsDetail();
    this.loadComments();
    this.loadBidRecords();
  },

  onShow() {
    if (this.goodsId) {
      this.loadGoodsDetail();
    }
  },

  onUnload() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  },

  loadGoodsDetail() {
    app.request({
      url: '/goods/detail',
      data: { id: this.goodsId }
    }).then(res => {
      const goods = {
        ...res,
        priceText: app.formatPrice(res.currentPrice || res.price),
        originalPriceText: res.originalPrice ? app.formatPrice(res.originalPrice) : ''
      };
      this.setData({ 
        goods,
        countdown: app.countdown(res.endTime),
        isSubscribed: res.isSubscribed
      });
      this.startCountdown();
      this.generateShareUrl();
    });
  },

  loadComments() {
    app.request({
      url: '/goods/comments',
      data: { goodsId: this.goodsId }
    }).then(res => {
      this.setData({ comments: res.list || [] });
    });
  },

  loadBidRecords() {
    app.request({
      url: '/goods/bid-records',
      data: { goodsId: this.goodsId }
    }).then(res => {
      this.setData({ bidRecords: res.list || [] });
    });
  },

  startCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    this.countdownTimer = setInterval(() => {
      if (this.data.goods && this.data.goods.endTime) {
        this.setData({
          countdown: app.countdown(this.data.goods.endTime)
        });
      }
    }, 1000);
  },

  generateShareUrl() {
    const userId = app.globalData.userInfo?.id;
    if (userId) {
      const shareUrl = `/pages/detail/detail?id=${this.goodsId}&shareBy=${userId}`;
      this.setData({ shareUrl });
    }
  },

  onImageChange(e) {
    this.setData({ currentImageIndex: e.detail.current });
  },

  previewImage(e) {
    const urls = this.data.goods.images;
    const current = urls[e.currentTarget.dataset.index];
    wx.previewImage({ urls, current });
  },

  onBidInput(e) {
    this.setData({ bidAmount: e.detail.value });
  },

  bid() {
    const { goods, bidAmount } = this.data;
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    const minBid = Number(goods.currentPrice) + Number(goods.minIncrement);
    if (Number(bidAmount) < minBid) {
      wx.showToast({ title: `出价不能低于${minBid}元`, icon: 'none' });
      return;
    }
    wx.showModal({
      title: '确认出价',
      content: `确定出价 ${bidAmount} 元？`,
      success: (res) => {
        if (res.confirm) {
          app.request({
            url: '/auction/bid',
            method: 'POST',
            data: {
              goodsId: this.goodsId,
              amount: Number(bidAmount)
            }
          }).then(() => {
            wx.showToast({ title: '出价成功' });
            this.loadGoodsDetail();
            this.loadBidRecords();
            this.setData({ bidAmount: '' });
          });
        }
      }
    });
  },

  buyNow() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    const { goods } = this.data;
    wx.showModal({
      title: '确认购买',
      content: `确定以 ${goods.priceText} 元购买？`,
      success: (res) => {
        if (res.confirm) {
          app.request({
            url: '/order/create',
            method: 'POST',
            data: {
              goodsId: this.goodsId,
              type: goods.type,
              amount: goods.currentPrice || goods.price
            }
          }).then(() => {
            wx.showToast({ title: '购买成功' });
            setTimeout(() => {
              wx.navigateTo({ url: '/pages/participated/participated?tab=purchased' });
            }, 1500);
          });
        }
      }
    });
  },

  joinGroup() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    app.request({
      url: '/groupbuy/join',
      method: 'POST',
      data: { goodsId: this.goodsId }
    }).then(res => {
      wx.showToast({ title: '拼团成功' });
      this.loadGoodsDetail();
    });
  },

  seckillBuy() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    if (this.data.countdown?.ended) {
      wx.showToast({ title: '活动已结束', icon: 'none' });
      return;
    }
    if (this.data.goods.stock <= 0) {
      wx.showToast({ title: '已抢光', icon: 'none' });
      return;
    }
    app.request({
      url: '/seckill/buy',
      method: 'POST',
      data: { goodsId: this.goodsId }
    }).then(() => {
      wx.showToast({ title: '秒杀成功' });
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/participated/participated?tab=purchased' });
      }, 1500);
    });
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
      data: { publisherId: this.data.goods.seller.id }
    }).then(() => {
      this.setData({ isSubscribed: !this.data.isSubscribed });
      wx.showToast({ 
        title: this.data.isSubscribed ? '已订阅' : '已取消订阅',
        icon: 'success'
      });
    });
  },

  goStore() {
    wx.navigateTo({
      url: `/pages/store/store?id=${this.data.goods.seller.id}`
    });
  },

  showShareModal() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.setData({ showShare: true });
  },

  hideShareModal() {
    this.setData({ showShare: false });
  },

  onShareAppMessage() {
    const { goods } = this.data;
    const userId = app.globalData.userInfo?.id;
    return {
      title: goods.title,
      path: `/pages/detail/detail?id=${this.goodsId}&shareBy=${userId}`,
      imageUrl: goods.images[0]
    };
  },

  onShareTimeline() {
    const { goods } = this.data;
    const userId = app.globalData.userInfo?.id;
    return {
      title: goods.title,
      query: `id=${this.goodsId}&shareBy=${userId}`,
      imageUrl: goods.images[0]
    };
  },

  copyShareLink() {
    wx.setClipboardData({
      data: this.data.shareUrl,
      success: () => {
        wx.showToast({ title: '链接已复制' });
      }
    });
  },

  savePoster() {
    wx.showToast({ title: '海报生成中...', icon: 'loading' });
    setTimeout(() => {
      wx.showToast({ title: '海报已保存', icon: 'success' });
    }, 1000);
  }
});
