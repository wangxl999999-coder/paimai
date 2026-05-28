const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BidRecord = sequelize.define('BidRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  goodsId: {
    type: DataTypes.INTEGER,
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
  isMax: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  autoBid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'bid_records',
  timestamps: true,
  indexes: [
    { fields: ['goodsId'] },
    { fields: ['userId'] },
    { fields: ['goodsId', 'isMax'] }
  ]
});

module.exports = BidRecord;
