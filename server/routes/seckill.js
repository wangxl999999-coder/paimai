const express = require('express');
const { Goods, Order } = require('../models');
const router = express.Router();

router.post('/buy', async (req, res) => {
  try {
    const { goodsId, quantity = 1 } = req.body;
    const userId = req.user.id;
    const goods = await Goods.findByPk(goodsId);
    if (!goods || goods.type !== 'seckill') {
      return res.json({ code: 404, message: '秒杀商品不存在' });
    }
    if (goods.status !== 'active') {
      return res.json({ code: 400, message: '活动已结束' });
    }
    const now = new Date();
    if (goods.startTime && new Date(goods.startTime) > now) {
      return res.json({ code: 400, message: '活动尚未开始' });
    }
    if (goods.endTime && new Date(goods.endTime) < now) {
      return res.json({ code: 400, message: '活动已结束' });
    }
    if (goods.stock < quantity) {
      return res.json({ code: 400, message: '库存不足' });
    }
    const limitPerUser = goods.limitPerUser || 1;
    const userBuyCount = await Order.count({
      where: { goodsId, buyerId: userId, status: { $ne: 'cancelled' } }
    });
    if (userBuyCount + quantity > limitPerUser) {
      return res.json({ code: 400, message: `每人限购${limitPerUser}件` });
    }
    const t = await require('../config/database').transaction();
    try {
      const result = await Goods.decrement(
        { stock: quantity },
        { where: { id: goodsId, stock: { $gte: quantity } }, transaction: t }
      );
      if (result[0] === 0) {
        await t.rollback();
        return res.json({ code: 400, message: '手慢了，已被抢光' });
      }
      const orderNo = 'O' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();
      const totalAmount = Number(goods.price) * quantity + Number(goods.shippingFee || 0);
      await Order.create({
        orderNo,
        type: 'seckill',
        goodsId,
        buyerId: userId,
        sellerId: goods.sellerId,
        amount: Number(goods.price) * quantity,
        shippingFee: goods.shippingFee || 0,
        totalAmount,
        quantity,
        commission: (goods.commission || 0) * quantity,
        status: 'pending'
      }, { transaction: t });
      await Goods.increment(
        { soldCount: quantity },
        { where: { id: goodsId }, transaction: t }
      );
      await t.commit();
      res.json({ code: 0, data: { orderNo, price: goods.price } });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '秒杀失败' });
  }
});

module.exports = router;
