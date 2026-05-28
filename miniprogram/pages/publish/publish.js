const app = getApp();

Page({
  data: {
    types: [
      { id: 'auction', name: '竞价拍卖', icon: '🔨', desc: '支持个人闲置物品、技能服务拍卖' },
      { id: 'fixed', name: '一口价', icon: '💰', desc: '创建商品并在个人店铺中出售' },
      { id: 'group', name: '阶梯拼团', icon: '👥', desc: '商家拼团工具，人越多越便宜' },
      { id: 'seckill', name: '秒杀活动', icon: '⚡', desc: '选择商品后，限时、限量促销' }
    ],
    activeType: '',
    form: {
      title: '',
      description: '',
      category: '',
      condition: '全新',
      price: '',
      startPrice: '',
      minIncrement: '1',
      reservePrice: '',
      originalPrice: '',
      stock: '1',
      limitPerUser: '1',
      shippingFee: '0',
      location: '',
      startTime: '',
      endTime: '',
      duration: '7',
      stepPrices: [],
      commission: '',
      isWelfare: false,
      skillService: false
    },
    images: [],
    categories: ['数码产品', '服饰鞋包', '家居生活', '美妆护肤', '母婴用品', '运动户外', '图书文具', '技能服务', '其他'],
    conditions: ['全新', '几乎全新', '轻微使用', '明显使用'],
    durations: [
      { value: '1', label: '1天' },
      { value: '3', label: '3天' },
      { value: '7', label: '7天' },
      { value: '14', label: '14天' },
      { value: '30', label: '30天' }
    ],
    currentTypeName: '',
    currentDurationLabel: '7天',
    showStepPriceModal: false,
    newStep: { count: '', price: '' }
  },

  onLoad() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' });
    }
  },

  selectType(e) {
    const type = e.currentTarget.dataset.type;
    const typeInfo = this.data.types.find(t => t.id === type);
    this.setData({ 
      activeType: type,
      currentTypeName: typeInfo ? typeInfo.name : ''
    });
    this.initStepPrices(type);
  },

  initStepPrices(type) {
    if (type === 'group') {
      this.setData({
        'form.stepPrices': [
          { count: 2, price: '', reached: false },
          { count: 5, price: '', reached: false },
          { count: 10, price: '', reached: false }
        ]
      });
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  selectCategory(e) {
    this.setData({
      'form.category': this.data.categories[e.detail.value]
    });
  },

  selectCondition(e) {
    this.setData({
      'form.condition': this.data.conditions[e.detail.value]
    });
  },

  selectDuration(e) {
    const durationInfo = this.data.durations[e.detail.value];
    this.setData({ 
      'form.duration': durationInfo.value,
      currentDurationLabel: durationInfo.label
    });
  },

  selectStartTime(e) {
    this.setData({ 'form.startTime': e.detail.value });
  },

  selectEndTime(e) {
    this.setData({ 'form.endTime': e.detail.value });
  },

  chooseImage() {
    const maxCount = 9 - this.data.images.length;
    if (maxCount <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
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

  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      urls: this.data.images,
      current: this.data.images[index]
    });
  },

  toggleWelfare(e) {
    this.setData({ 'form.isWelfare': e.detail.value });
  },

  toggleSkillService(e) {
    this.setData({ 'form.skillService': e.detail.value });
  },

  showStepModal() {
    this.setData({ showStepPriceModal: true });
  },

  hideStepModal() {
    this.setData({ showStepPriceModal: false, newStep: { count: '', price: '' } });
  },

  onStepInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`newStep.${field}`]: e.detail.value
    });
  },

  addStepPrice() {
    const { newStep, form } = this.data;
    if (!newStep.count || !newStep.price) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }
    const stepPrices = [...form.stepPrices, { ...newStep, reached: false }];
    stepPrices.sort((a, b) => a.count - b.count);
    this.setData({
      'form.stepPrices': stepPrices,
      showStepPriceModal: false,
      newStep: { count: '', price: '' }
    });
  },

  removeStepPrice(e) {
    const index = e.currentTarget.dataset.index;
    const stepPrices = this.data.form.stepPrices.filter((_, i) => i !== index);
    this.setData({ 'form.stepPrices': stepPrices });
  },

  submit() {
    const { activeType, form, images } = this.data;
    if (!activeType) {
      wx.showToast({ title: '请选择发布类型', icon: 'none' });
      return;
    }
    if (!form.title.trim()) {
      wx.showToast({ title: '请填写商品标题', icon: 'none' });
      return;
    }
    if (images.length === 0) {
      wx.showToast({ title: '请上传商品图片', icon: 'none' });
      return;
    }
    if (activeType === 'auction') {
      if (!form.startPrice) {
        wx.showToast({ title: '请填写起拍价', icon: 'none' });
        return;
      }
    } else if (activeType === 'fixed' || activeType === 'seckill') {
      if (!form.price) {
        wx.showToast({ title: '请填写商品价格', icon: 'none' });
        return;
      }
    } else if (activeType === 'group') {
      const hasEmptyStep = form.stepPrices.some(s => !s.price);
      if (hasEmptyStep) {
        wx.showToast({ title: '请填写所有阶梯价格', icon: 'none' });
        return;
      }
    }
    const now = new Date();
    const startTime = form.startTime || now.toISOString().slice(0, 16).replace('T', ' ');
    let endTime = form.endTime;
    if (!endTime && form.duration) {
      const end = new Date(now.getTime() + Number(form.duration) * 24 * 60 * 60 * 1000);
      endTime = end.toISOString().slice(0, 16).replace('T', ' ');
    }
    const submitData = {
      type: activeType,
      title: form.title,
      description: form.description,
      category: form.category,
      condition: form.condition,
      images,
      startTime,
      endTime,
      shippingFee: Number(form.shippingFee),
      location: form.location,
      commission: form.commission ? Number(form.commission) : undefined,
      isWelfare: form.isWelfare,
      skillService: form.skillService
    };
    if (activeType === 'auction') {
      submitData.startPrice = Number(form.startPrice);
      submitData.minIncrement = Number(form.minIncrement) || 1;
      submitData.currentPrice = Number(form.startPrice);
      if (form.reservePrice) {
        submitData.reservePrice = Number(form.reservePrice);
      }
    } else if (activeType === 'fixed') {
      submitData.price = Number(form.price);
      submitData.stock = Number(form.stock) || 1;
      submitData.originalPrice = form.originalPrice ? Number(form.originalPrice) : undefined;
    } else if (activeType === 'group') {
      submitData.stepPrices = form.stepPrices.map(s => ({
        count: Number(s.count),
        price: Number(s.price)
      }));
      submitData.price = Number(form.stepPrices[0]?.price || 0);
      submitData.stock = Number(form.stock) || 10;
    } else if (activeType === 'seckill') {
      submitData.price = Number(form.price);
      submitData.originalPrice = Number(form.originalPrice || form.price);
      submitData.stock = Number(form.stock) || 1;
      submitData.limitPerUser = Number(form.limitPerUser) || 1;
    }
    wx.showLoading({ title: '发布中...' });
    app.request({
      url: '/goods/publish',
      method: 'POST',
      data: submitData
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '发布成功' });
      setTimeout(() => {
        this.resetForm();
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    }).catch((err) => {
      wx.hideLoading();
      wx.showToast({ title: err.message || '发布失败', icon: 'none' });
    });
  },

  resetForm() {
    this.setData({
      activeType: '',
      images: [],
      form: {
        title: '',
        description: '',
        category: '',
        condition: '全新',
        price: '',
        startPrice: '',
        minIncrement: '1',
        reservePrice: '',
        originalPrice: '',
        stock: '1',
        limitPerUser: '1',
        shippingFee: '0',
        location: '',
        startTime: '',
        endTime: '',
        duration: '7',
        stepPrices: [],
        commission: '',
        isWelfare: false,
        skillService: false
      }
    });
  }
});
