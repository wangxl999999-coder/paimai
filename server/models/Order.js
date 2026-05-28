const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNo: {
    type: DataTypes.STRING(32),
    unique: true,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('auction', 'fixed', 'group', 'seckill'),
    allowNull: false
  },
  goodsId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  shareBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '分享者ID，用于计算佣金'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shippingFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  commission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '佣金金额'
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  payTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shipTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completeTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shippingCompany: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shippingNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  receiverName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  receiverPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  receiverAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '拼团组ID'
  },
  bidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '出价金额'
  },
  isWinner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否中拍'
  },
  commissionSettled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '佣金是否已结算'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [
    { fields: ['orderNo'] },
    { fields: ['buyerId'] },
    { fields: ['sellerId'] },
    { fields: ['goodsId'] },
    { fields: ['status'] }
  ]
});

module.exports = Order;
