const app = getApp();

Page({
  data: {
    servicePhone: '400-123-4567',
    serviceTime: '周一至周日 9:00-21:00',
    serviceWechat: 'paimai_service',
    message: '',
    images: [],
    submitting: false
  },

  onInput(e) {
    this.setData({ message: e.detail.value });
  },

  callPhone() {
    wx.makePhoneCall({
      phoneNumber: this.data.servicePhone
    });
  },

  copyWechat() {
    wx.setClipboardData({
      data: this.data.serviceWechat,
      success: () => {
        wx.showToast({ title: '已复制微信号' });
      }
    });
  },

  chooseImage() {
    const maxCount = 3 - this.data.images.length;
    if (maxCount <= 0) {
      wx.showToast({ title: '最多上传3张图片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: maxCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const files = res.tempFiles.map(file => file.tempFilePath);
        this.uploadImages(files);
      }
    });
  },

  uploadImages(files) {
    wx.showLoading({ title: '上传中...' });
    const uploadPromises = files.map(filePath => {
      return app.uploadFile({
        url: '/upload/image',
        filePath
      });
    });
    Promise.all(uploadPromises).then(results => {
      wx.hideLoading();
      const urls = results.map(r => r.url);
      this.setData({
        images: [...this.data.images, ...urls]
      });
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '上传失败', icon: 'none' });
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.filter((_, i) => i !== index);
    this.setData({ images });
  },

  submit() {
    if (!this.data.message.trim()) {
      wx.showToast({ title: '请输入问题描述', icon: 'none' });
      return;
    }
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });
    setTimeout(() => {
      wx.hideLoading();
      this.setData({ submitting: false, message: '', images: [] });
      wx.showModal({
        title: '提交成功',
        content: '我们已收到您的反馈，将在24小时内与您联系。',
        showCancel: false
      });
    }, 1000);
  }
});
