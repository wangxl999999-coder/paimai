const express = require('express');
const { Op } = require('sequelize');
const { User, Goods, Order, Commission, Withdraw, Subscribe, BidRecord } = require('../models');
const router = express.Router();

router.get('/info', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json({ code: 0, data: user });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取用户信息失败' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const publishedCount = await Goods.count({ where: { sellerId: userId } });
    const soldCount = await Order.count({ where: { sellerId: userId, status: { [Op.ne]: 'cancelled' } } });
    const purchasedCount = await Order.count({ where: { buyerId: userId, status: { [Op.ne]: 'cancelled' } } });
    const totalAmount = await Order.sum('totalAmount', {
      where: { sellerId: userId, status: { [Op.in]: ['completed', 'paid', 'shipped'] } }
    });
    const fansCount = await Subscribe.count({ where: { publisherId: userId } });
    const subscribeCount = await Subscribe.count({ where: { userId } });
    const user = await User.findByPk(userId);
    await User.update({ fansCount, subscribeCount }, { where: { id: userId } });
    res.json({
      code: 0,
      data: {
        publishedCount,
        soldCount,
        purchasedCount,
        totalAmount: totalAmount || 0,
        commission: user.commission || 0,
        availableCommission: user.availableCommission || 0,
        frozenCommission: user.frozenCommission || 0,
        fansCount,
        subscribeCount
      }
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取统计失败' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type = 'published' } = req.query;
    const userId = req.user.id;
    let where = {};
    let includeGoods = true;
    if (type === 'published') {
      where = { sellerId: userId };
      includeGoods = false;
      const goodsList = await Goods.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * pageSize,
        limit: Number(pageSize)
      });
      return res.json({
        code: 0,
        data: { list: goodsList.rows, total: goodsList.count }
      });
    } else if (type === 'sold') {
      where = { sellerId: userId };
    } else if (type === 'purchased') {
      where = { buyerId: userId };
    } else if (type === 'joined') {
      const bids = await BidRecord.findAll({
        where: { userId },
        attributes: ['goodsId'],
        group: ['goodsId']
      });
      const goodsIds = bids.map(b => b.goodsId);
      if (goodsIds.length === 0) {
        return res.json({ code: 0, data: { list: [], total: 0 } });
      }
      where = { id: { [Op.in]: goodsIds } };
      includeGoods = false;
      const goodsList = await Goods.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        offset: (page - 1) * pageSize,
        limit: Number(pageSize)
      });
      const list = [];
      for (let goods of goodsList.rows) {
        const bid = await BidRecord.findOne({
          where: { goodsId: goods.id, userId },
          order: [['createdAt', 'DESC']]
        });
        list.push({
          ...goods.toJSON(),
          bidAmount: bid?.amount,
          winner: goods.winnerId === userId
        });
      }
      return res.json({ code: 0, data: { list, total: goodsList.count } });
    }
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: Goods, as: 'goods' }
      ],
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    const list = rows.map(item => {
      const data = item.toJSON();
      if (data.goods) {
        return {
          ...data,
          ...data.goods,
          goodsId: data.goods.id
        };
      }
      return data;
    });
    res.json({ code: 0, data: { list, total: count } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取订单失败' });
  }
});

router.get('/commissions', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status = '' } = req.query;
    const userId = req.user.id;
    const where = { userId };
    if (status) where.status = status;
    const { count, rows } = await Commission.findAndCountAll({
      where,
      include: [
        { model: Goods, as: 'goods', attributes: ['id', 'title', 'images'] },
        { model: User, as: 'fromUser', attributes: ['id', 'nickname', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    res.json({ code: 0, data: { list: rows, total: count } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取佣金明细失败' });
  }
});

router.post('/withdraw', async (req, res) => {
  try {
    const { amount, type = 'wechat', account, accountName } = req.body;
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (Number(amount) < 10) {
      return res.json({ code: 400, message: '最低提现10元' });
    }
    if (Number(amount) > Number(user.availableCommission)) {
      return res.json({ code: 400, message: '可提现金额不足' });
    }
    if (!account || !accountName) {
      return res.json({ code: 400, message: '请填写提现账号信息' });
    }
    const fee = Math.floor(Number(amount) * 0.01 * 100) / 100;
    const actualAmount = Number(amount) - fee;
    const orderNo = 'W' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();
    await Withdraw.create({
      orderNo,
      userId,
      amount,
      fee,
      actualAmount,
      type,
      account,
      accountName
    });
    user.availableCommission = Number(user.availableCommission) - Number(amount);
    user.frozenCommission = Number(user.frozenCommission) + Number(amount);
    await user.save();
    res.json({ code: 0, data: { orderNo } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '提现申请失败' });
  }
});

router.get('/withdraws', async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const userId = req.user.id;
    const { count, rows } = await Withdraw.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    res.json({ code: 0, data: { list: rows, total: count } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取提现记录失败' });
  }
});

router.post('/subscribe', async (req, res) => {
  try {
    const { publisherId } = req.body;
    const userId = req.user.id;
    if (Number(publisherId) === userId) {
      return res.json({ code: 400, message: '不能订阅自己' });
    }
    const existing = await Subscribe.findOne({ where: { userId, publisherId } });
    if (existing) {
      return res.json({ code: 0, data: { subscribed: true } });
    }
    await Subscribe.create({ userId, publisherId });
    await User.increment({ fansCount: 1 }, { where: { id: publisherId } });
    await User.increment({ subscribeCount: 1 }, { where: { id: userId } });
    res.json({ code: 0, data: { subscribed: true } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '订阅失败' });
  }
});

router.post('/unsubscribe', async (req, res) => {
  try {
    const { publisherId } = req.body;
    const userId = req.user.id;
    const existing = await Subscribe.findOne({ where: { userId, publisherId } });
    if (existing) {
      await existing.destroy();
      await User.decrement({ fansCount: 1 }, { where: { id: publisherId } });
      await User.decrement({ subscribeCount: 1 }, { where: { id: userId } });
    }
    res.json({ code: 0, data: { subscribed: false } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '取消订阅失败' });
  }
});

router.get('/subscriptions', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const userId = req.user.id;
    const { count, rows } = await Subscribe.findAndCountAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'subscribedPublishers',
          attributes: ['id', 'nickname', 'avatar', 'isVerified', 'hasWelfare', 'fansCount', 'storeName']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    const list = rows.map(item => item.subscribedPublishers).filter(Boolean);
    res.json({ code: 0, data: { list, total: count } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取订阅列表失败' });
  }
});

module.exports = router;
