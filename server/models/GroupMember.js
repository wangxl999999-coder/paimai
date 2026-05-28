const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GroupMember = sequelize.define('GroupMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  groupId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isLeader: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'group_members',
  timestamps: true,
  indexes: [
    { fields: ['groupId'] },
    { fields: ['userId'] }
  ]
});

module.exports = GroupMember;
