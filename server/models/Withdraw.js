const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Withdraw = sequelize.define('Withdraw', {
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '手续费'
  },
  actualAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '实际到账金额'
  },
  type: {
    type: DataTypes.ENUM('wechat', 'alipay', 'bank'),
    defaultValue: 'wechat',
    comment: '提现方式'
  },
  account: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '提现账号'
  },
  accountName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '账户姓名'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid', 'failed'),
    defaultValue: 'pending',
    comment: '状态:pending待审核,approved已通过,rejected已拒绝,paid已打款,failed失败'
  },
  auditTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  auditUserId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  auditRemark: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  payNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'withdraws',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['orderNo'] }
  ]
});

module.exports = Withdraw;
