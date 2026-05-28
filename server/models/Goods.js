const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Goods = sequelize.define('Goods', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('auction', 'fixed', 'group', 'seckill'),
    allowNull: false,
    comment: '类型:auction竞价,fixed一口价,group拼团,seckill秒杀'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  condition: {
    type: DataTypes.ENUM('全新', '几乎全新', '轻微使用', '明显使用'),
    defaultValue: '全新'
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const raw = this.getDataValue('images');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('images', JSON.stringify(val));
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '一口价/秒杀价/起拍价'
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  startPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '起拍价(竞价)'
  },
  currentPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '当前价(竞价)'
  },
  minIncrement: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1,
    comment: '加价幅度'
  },
  reservePrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '保留价'
  },
  stepPrices: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '阶梯拼团价格配置',
    get() {
      const raw = this.getDataValue('stepPrices');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('stepPrices', JSON.stringify(val));
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  soldCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bidCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  joinedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '拼团人数'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  limitPerUser: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  shippingFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  commission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '分享佣金'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isWelfare: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否福利拍卖'
  },
  skillService: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否技能服务'
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  winnerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '中拍者ID'
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'ended', 'sold', 'cancelled'),
    defaultValue: 'pending'
  },
  topOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'goods',
  timestamps: true,
  indexes: [
    { fields: ['type', 'status'] },
    { fields: ['sellerId'] },
    { fields: ['endTime'] }
  ]
});

module.exports = Goods;
