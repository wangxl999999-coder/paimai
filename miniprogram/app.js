App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: 'http://localhost:3003/api',
    subscribeList: []
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token) {
      this.globalData.token = token;
    }
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
    this.checkUpdate();
  },

  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(() => {
            wx.showModal({
              title: '更新提示',
              content: '新版本已准备好，是否重启应用？',
              success: (res) => {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              }
            });
          });
        }
      });
    }
  },

  request(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'content-type': 'application/json',
          'Authorization': 'Bearer ' + this.globalData.token
        },
        success: (res) => {
          if (res.data.code === 0) {
            resolve(res.data.data);
          } else if (res.data.code === 401) {
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            this.globalData.token = '';
            this.globalData.userInfo = null;
            wx.navigateTo({
              url: '/pages/login/login'
            });
            reject(res.data);
          } else {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            });
            reject(res.data);
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  },

  uploadFile(options) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: this.globalData.baseUrl + options.url,
        filePath: options.filePath,
        name: 'file',
        header: {
          'Authorization': 'Bearer ' + this.globalData.token
        },
        formData: options.formData || {},
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.code === 0) {
            resolve(data.data);
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            });
            reject(data);
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours();
    const minute = d.getMinutes();
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  },

  formatPrice(price) {
    return '¥' + Number(price).toFixed(2);
  },

  countdown(endTime) {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;
    if (diff <= 0) return { text: '已结束', ended: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    let text = '';
    if (days > 0) text += days + '天';
    if (hours > 0 || days > 0) text += hours.toString().padStart(2, '0') + ':';
    text += minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
    return { text, ended: false, days, hours, minutes, seconds };
  }
});
