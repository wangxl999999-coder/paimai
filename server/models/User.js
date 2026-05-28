const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  openid: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '用户'
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar&image_size=square'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  commission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '累计佣金'
  },
  availableCommission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '可提现佣金'
  },
  frozenCommission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '冻结中佣金'
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否实名认证'
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fansCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  subscribeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  storeName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  storeDesc: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hasWelfare: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('active', 'disabled'),
    defaultValue: 'active'
  },
  lastLoginTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginIp: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
