const app = getApp();

Page({
  data: {
    phone: '',
    password: '',
    code: '',
    loginType: 'wx'
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ loginType: type });
  },

  wxLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.getUserProfile({
            desc: '用于完善会员资料',
            success: (profileRes) => {
              this.doWxLogin(res.code, profileRes.userInfo);
            },
            fail: () => {
              this.doWxLogin(res.code);
            }
          });
        }
      }
    });
  },

  doWxLogin(code, userInfo) {
    wx.showLoading({ title: '登录中...' });
    app.request({
      url: '/auth/wx-login',
      method: 'POST',
      data: {
        code,
        nickName: userInfo?.nickName,
        avatarUrl: userInfo?.avatarUrl
      }
    }).then(res => {
      wx.hideLoading();
      this.handleLoginSuccess(res);
    }).catch(() => {
      wx.hideLoading();
    });
  },

  phoneLogin() {
    const { phone, password } = this.data;
    if (!phone || !password) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '登录中...' });
    app.request({
      url: '/auth/login',
      method: 'POST',
      data: { phone, password }
    }).then(res => {
      wx.hideLoading();
      this.handleLoginSuccess(res);
    }).catch(() => {
      wx.hideLoading();
    });
  },

  handleLoginSuccess(res) {
    app.globalData.token = res.token;
    app.globalData.userInfo = res.user;
    wx.setStorageSync('token', res.token);
    wx.setStorageSync('userInfo', res.user);
    wx.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' });
    }, 1000);
  },

  goRegister() {
    wx.showToast({ title: '请使用微信登录', icon: 'none' });
  }
});
