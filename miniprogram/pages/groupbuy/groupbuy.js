const app = getApp();

Page({
  data: {
    goodsId: '',
    goods: {},
    tiers: [],
    currentTierIndex: 0,
    currentTier: {},
    currentCount: 0,
    diffCount: 0,
    nextTierPrice: 0,
    progressPercent: 0,
    groups: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ goodsId: options.id });
      this.loadGoodsDetail();
      this.loadGroups();
    }
  },

  loadGoodsDetail() {
    wx.showLoading({ title: '加载中...' });
    app.request({
      url: '/goods/detail',
      data: { id: this.data.goodsId }
    }).then(res => {
      wx.hideLoading();
      const tiers = res.groupTiers || [
        { minCount: 2, price: res.price * 0.9 },
        { minCount: 5, price: res.price * 0.8 },
        { minCount: 10, price: res.price * 0.7 }
      ];
      this.setData({
        goods: res,
        tiers,
        currentTier: tiers[0],
        currentCount: res.currentGroupCount || 0
      });
      this.calculateProgress();
    }).catch(() => {
      wx.hideLoading();
    });
  },

  loadGroups() {
    app.request({
      url: '/groupbuy/list',
      data: { goodsId: this.data.goodsId }
    }).then(res => {
      const groups = (res.list || []).map(item => ({
        ...item,
        countdown: this.formatCountdown(item.expireTime)
      }));
      this.setData({ groups });
    });
  },

  calculateProgress() {
    const { tiers, currentCount } = this.data;
    let currentTierIndex = 0;
    let nextTierPrice = tiers[0].price;
    let diffCount = tiers[0].minCount - currentCount;

    for (let i = tiers.length - 1; i >= 0; i--) {
      if (currentCount >= tiers[i].minCount) {
        currentTierIndex = i;
        if (i < tiers.length - 1) {
          nextTierPrice = tiers[i + 1].price;
          diffCount = tiers[i + 1].minCount - currentCount;
        } else {
          nextTierPrice = tiers[i].price;
          diffCount = 0;
        }
        break;
      }
    }

    const maxCount = tiers[tiers.length - 1].minCount;
    const progressPercent = Math.min((currentCount / maxCount) * 100, 100);

    this.setData({
      currentTierIndex,
      currentTier: tiers[currentTierIndex],
      nextTierPrice,
      diffCount: Math.max(diffCount, 0),
      progressPercent
    });
  },

  formatCountdown(expireTime) {
    const diff = new Date(expireTime).getTime() - Date.now();
    if (diff <= 0) return '已结束';
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}时${minutes}分`;
  },

  joinGroup(e) {
    const groupId = e.currentTarget.dataset.groupid;
    wx.showModal({
      title: '确认参团',
      content: `当前价格 ¥${this.data.currentTier.price}`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '参团中...' });
          app.request({
            url: '/groupbuy/join',
            method: 'POST',
            data: { groupId, goodsId: this.data.goodsId }
          }).then(() => {
            wx.hideLoading();
            wx.showToast({ title: '参团成功' });
            setTimeout(() => {
              wx.redirectTo({
                url: `/pages/participated/participated?tab=joined`
              });
            }, 1500);
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: err.message || '参团失败', icon: 'none' });
          });
        }
      }
    });
  },

  startGroup() {
    wx.showModal({
      title: '发起拼团',
      content: `发起人价格 ¥${this.data.tiers[0].price}`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '创建中...' });
          app.request({
            url: '/groupbuy/start',
            method: 'POST',
            data: { goodsId: this.data.goodsId }
          }).then(() => {
            wx.hideLoading();
            wx.showToast({ title: '拼团创建成功' });
            setTimeout(() => {
              wx.redirectTo({
                url: `/pages/participated/participated?tab=joined`
              });
            }, 1500);
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: err.message || '创建失败', icon: 'none' });
          });
        }
      }
    });
  }
});
