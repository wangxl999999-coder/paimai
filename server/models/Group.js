const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Group = sequelize.define('Group', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  goodsId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  leaderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '团长ID'
  },
  maxCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '成团人数'
  },
  currentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    defaultValue: 'pending',
    comment: 'pending拼团中,success拼团成功,failed拼团失败'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  successTime: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'groups',
  timestamps: true,
  indexes: [
    { fields: ['goodsId'] },
    { fields: ['leaderId'] },
    { fields: ['status'] }
  ]
});

module.exports = Group;
