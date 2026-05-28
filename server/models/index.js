const User = require('./User');
const Goods = require('./Goods');
const Order = require('./Order');
const BidRecord = require('./BidRecord');
const Commission = require('./Commission');
const Withdraw = require('./Withdraw');
const Subscribe = require('./Subscribe');
const FAQ = require('./FAQ');
const Group = require('./Group');
const GroupMember = require('./GroupMember');

User.hasMany(Goods, { foreignKey: 'sellerId', as: 'sellerGoods' });
Goods.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

User.hasMany(Order, { foreignKey: 'buyerId', as: 'buyOrders' });
User.hasMany(Order, { foreignKey: 'sellerId', as: 'sellOrders' });
Order.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });
Order.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Order.belongsTo(Goods, { foreignKey: 'goodsId', as: 'goods' });

Goods.hasMany(Order, { foreignKey: 'goodsId', as: 'orders' });
Goods.hasMany(BidRecord, { foreignKey: 'goodsId', as: 'bidRecords' });
BidRecord.belongsTo(Goods, { foreignKey: 'goodsId', as: 'goods' });
BidRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(BidRecord, { foreignKey: 'userId', as: 'bids' });

User.hasMany(Commission, { foreignKey: 'userId', as: 'commissions' });
Commission.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Commission.belongsTo(User, { foreignKey: 'fromUserId', as: 'fromUser' });
Commission.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Commission.belongsTo(Goods, { foreignKey: 'goodsId', as: 'goods' });

User.hasMany(Withdraw, { foreignKey: 'userId', as: 'withdraws' });
Withdraw.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.belongsToMany(User, {
  through: Subscribe,
  as: 'subscribers',
  foreignKey: 'publisherId',
  otherKey: 'userId'
});
User.belongsToMany(User, {
  through: Subscribe,
  as: 'subscribedPublishers',
  foreignKey: 'userId',
  otherKey: 'publisherId'
});

Goods.hasMany(Group, { foreignKey: 'goodsId', as: 'groups' });
Group.belongsTo(Goods, { foreignKey: 'goodsId', as: 'goods' });
Group.belongsTo(User, { foreignKey: 'leaderId', as: 'leader' });

Group.hasMany(GroupMember, { foreignKey: 'groupId', as: 'members' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });
GroupMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Goods,
  Order,
  BidRecord,
  Commission,
  Withdraw,
  Subscribe,
  FAQ,
  Group,
  GroupMember
};
