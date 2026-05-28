const app = getApp();

Page({
  data: {
    availableAmount: 0,
    amount: '',
    type: 'wechat',
    account: '',
    accountName: '',
    types: [
      { id: 'wechat', name: '微信', icon: '💬' },
      { id: 'alipay', name: '支付宝', icon: '💰' },
      { id: 'bank', name: '银行卡', icon: '💳' }
    ],
    list: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.loadStats();
    this.loadList();
  },

  loadStats() {
    app.request({ url: '/user/stats' }).then(res => {
      this.setData({ availableAmount: res.availableCommission || 0 });
    });
  },

  loadList(refresh = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const page = refresh ? 1 : this.data.page;
    app.request({
      url: '/user/withdraws',
      data: { page, pageSize: this.data.pageSize }
    }).then(res => {
      const list = res.list.map(item => ({
        ...item,
        timeText: app.formatTime(item.createdAt)
      }));
      this.setData({
        list: refresh ? list : [...this.data.list, ...list],
        page: page + 1,
        hasMore: res.list.length >= this.data.pageSize,
        loading: false
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ type });
  },

  setAll() {
    this.setData({ amount: this.data.availableAmount.toString() });
  },

  submit() {
    const { amount, type, account, accountName, availableAmount } = this.data;
    if (!amount || Number(amount) <= 0) {
      wx.showToast({ title: '请输入提现金额', icon: 'none' });
      return;
    }
    if (Number(amount) < 10) {
      wx.showToast({ title: '最低提现10元', icon: 'none' });
      return;
    }
    if (Number(amount) > Number(availableAmount)) {
      wx.showToast({ title: '可提现金额不足', icon: 'none' });
      return;
    }
    if (!account) {
      wx.showToast({ title: '请输入账号', icon: 'none' });
      return;
    }
    if (!accountName) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    const fee = Math.floor(Number(amount) * 0.01 * 100) / 100;
    const actualAmount = (Number(amount) - fee).toFixed(2);
    wx.showModal({
      title: '确认提现',
      content: `提现金额：¥${amount}\n手续费：¥${fee}\n实际到账：¥${actualAmount}`,
      success: (res) => {
        if (res.confirm) {
          this.doWithdraw(amount, type, account, accountName);
        }
      }
    });
  },

  doWithdraw(amount, type, account, accountName) {
    wx.showLoading({ title: '提交中...' });
    app.request({
      url: '/user/withdraw',
      method: 'POST',
      data: { amount: Number(amount), type, account, accountName }
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '申请已提交' });
      this.setData({ amount: '' });
      this.loadStats();
      this.loadList(true);
    }).catch(() => {
      wx.hideLoading();
    });
  }
});
