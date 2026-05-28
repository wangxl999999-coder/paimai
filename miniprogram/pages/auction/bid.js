const app = getApp();

Page({
  data: {
    goodsId: '',
    goods: {},
    bidPrice: '',
    records: [],
    countdown: '',
    timer: null
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ goodsId: options.id });
      this.loadGoodsDetail();
      this.loadBidRecords();
      this.startCountdown();
    }
  },

  onUnload() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
    }
  },

  loadGoodsDetail() {
    app.request({
      url: '/goods/detail',
      data: { id: this.data.goodsId }
    }).then(res => {
      this.setData({ goods: res });
    });
  },

  loadBidRecords() {
    app.request({
      url: '/auction/records',
      data: { goodsId: this.data.goodsId }
    }).then(res => {
      const list = (res.list || []).map(item => ({
        ...item,
        timeText: app.formatTime(item.createdAt)
      }));
      this.setData({ records: list });
    });
  },

  startCountdown() {
    const timer = setInterval(() => {
      const endTime = new Date(this.data.goods.endTime).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        clearInterval(timer);
        this.setData({ countdown: '已结束' });
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      let countdown = '';
      if (days > 0) countdown += `${days}天`;
      countdown += `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      this.setData({ countdown });
    }, 1000);

    this.setData({ timer });
  },

  onPriceInput(e) {
    this.setData({ bidPrice: e.detail.value });
  },

  quickBid(e) {
    const amount = parseFloat(e.currentTarget.dataset.amount);
    const currentPrice = parseFloat(this.data.goods.currentPrice) || 0;
    const newPrice = currentPrice + amount;
    this.setData({ bidPrice: newPrice.toString() });
  },

  submitBid() {
    const price = parseFloat(this.data.bidPrice);
    const currentPrice = parseFloat(this.data.goods.currentPrice) || 0;
    const minIncrement = parseFloat(this.data.goods.minIncrement) || 1;

    if (!price || isNaN(price)) {
      wx.showToast({ title: '请输入出价金额', icon: 'none' });
      return;
    }

    if (price < currentPrice + minIncrement) {
      wx.showToast({ title: `出价不能低于¥${(currentPrice + minIncrement).toFixed(2)}`, icon: 'none' });
      return;
    }

    wx.showLoading({ title: '出价中...' });
    app.request({
      url: '/auction/bid',
      method: 'POST',
      data: { goodsId: this.data.goodsId, price }
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '出价成功' });
      this.setData({ bidPrice: '' });
      this.loadGoodsDetail();
      this.loadBidRecords();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: err.message || '出价失败', icon: 'none' });
    });
  }
});
