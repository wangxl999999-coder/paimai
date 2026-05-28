const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Commission = sequelize.define('Commission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '佣金获得者'
  },
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '购买者'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  goodsId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('share', 'invite', 'other'),
    defaultValue: 'share',
    comment: '佣金类型:share分享,invite邀请'
  },
  status: {
    type: DataTypes.ENUM('pending', 'available', 'settled', 'cancelled'),
    defaultValue: 'pending',
    comment: '状态:pending待生效,available可提现,settled已结算,cancelled已取消'
  },
  settledTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  availableTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'commissions',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['orderId'] },
    { fields: ['status'] }
  ]
});

module.exports = Commission;
