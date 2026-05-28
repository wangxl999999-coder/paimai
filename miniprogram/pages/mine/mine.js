const app = getApp();

Page({
  data: {
    userInfo: null,
    stats: {
      publishedCount: 0,
      soldCount: 0,
      purchasedCount: 0,
      totalAmount: 0,
      commission: 0,
      availableCommission: 0,
      fansCount: 0,
      subscribeCount: 0
    },
    statsError: false,
    menuGroups: [
      {
        title: '我的交易',
        items: [
          { icon: '📦', name: '我发布的', url: '/pages/participated/participated?tab=published' },
          { icon: '🤝', name: '我参与的', url: '/pages/participated/participated?tab=joined' },
          { icon: '🛒', name: '我买到的', url: '/pages/participated/participated?tab=purchased' },
          { icon: '💰', name: '我卖出的', url: '/pages/participated/participated?tab=sold' }
        ]
      },
      {
        title: '收益管理',
        items: [
          { icon: '💎', name: '我的佣金', url: '/pages/commission/commission', badge: 'new' },
          { icon: '💸', name: '提现申请', url: '/pages/withdraw/withdraw' }
        ]
      },
      {
        title: '我的店铺',
        items: [
          { icon: '🏠', name: '我的店铺', url: '' },
          { icon: '🎁', name: '福利拍卖', url: '/pages/welfare/welfare' },
          { icon: '📢', name: '我的订阅', url: '/pages/subscribe/subscribe' }
        ]
      },
      {
        title: '帮助中心',
        items: [
          { icon: '❓', name: '常见问题', url: '/pages/faq/faq' },
          { icon: '📞', name: '联系客服', url: '/pages/contact/contact' }
        ]
      }
    ]
  },

  onShow() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.loadUserInfo();
    this.loadStats();
  },

  loadUserInfo() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
    app.request({ url: '/user/info' }).then(res => {
      this.setData({ userInfo: res });
      app.globalData.userInfo = res;
      wx.setStorageSync('userInfo', res);
    }).catch(() => {});
  },

  loadStats() {
    app.request({ url: '/user/stats' }).then(res => {
      this.setData({ stats: res });
    }).catch(err => {
      this.setData({ statsError: true });
    });
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  goPage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      const userInfo = this.data.userInfo;
      if (userInfo) {
        wx.navigateTo({ url: `/pages/store/store?id=${userInfo.id}` });
      }
      return;
    }
    wx.navigateTo({ 
      url,
      fail: (err) => {
        console.error('navigateTo failed:', err);
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  goEditProfile() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goCommission() {
    wx.navigateTo({ url: '/pages/commission/commission' });
  },

  goWithdraw() {
    wx.navigateTo({ url: '/pages/withdraw/withdraw' });
  },

  onPullDownRefresh() {
    this.setData({ statsError: false });
    this.loadUserInfo();
    this.loadStats();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  onShareAppMessage() {
    const userInfo = this.data.userInfo;
    return {
      title: `${userInfo?.nickname || '我'}的拍卖店铺，快来看看吧！`,
      path: `/pages/store/store?id=${userInfo?.id}&shareBy=${userInfo?.id}`,
      imageUrl: userInfo?.avatar
    };
  }
});
