const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscribe = sequelize.define('Subscribe', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '订阅者ID'
  },
  publisherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '被订阅者ID'
  }
}, {
  tableName: 'subscribes',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['publisherId'] },
    { fields: ['userId', 'publisherId'], unique: true }
  ]
});

module.exports = Subscribe;
