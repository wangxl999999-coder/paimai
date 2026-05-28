const express = require('express');
const { Op } = require('sequelize');
const { Order, Goods, User, Commission } = require('../models');
const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { goodsId, type, amount, shareBy } = req.body;
    const userId = req.user.id;
    const goods = await Goods.findByPk(goodsId);
    if (!goods) {
      return res.json({ code: 404, message: '商品不存在' });
    }
    if (goods.stock <= 0) {
      return res.json({ code: 400, message: '库存不足' });
    }
    const orderNo = 'O' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const totalAmount = Number(amount) + Number(goods.shippingFee || 0);
    const order = await Order.create({
      orderNo,
      type: type || goods.type,
      goodsId,
      buyerId: userId,
      sellerId: goods.sellerId,
      shareBy,
      amount,
      shippingFee: goods.shippingFee || 0,
      totalAmount,
      quantity: 1,
      commission: goods.commission || 0,
      status: 'pending'
    });
    if (goods.type === 'fixed') {
      goods.stock -= 1;
      goods.soldCount = (goods.soldCount || 0) + 1;
      await goods.save();
    }
    if (shareBy && shareBy !== userId && goods.commission > 0) {
      await Commission.create({
        userId: shareBy,
        fromUserId: userId,
        orderId: order.id,
        goodsId,
        amount: goods.commission,
        type: 'share',
        status: 'pending',
        remark: `分享商品"${goods.title}"获得佣金`
      });
    }
    res.json({ code: 0, data: { orderNo, id: order.id } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '创建订单失败' });
  }
});

router.post('/pay', async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;
    const order = await Order.findByPk(orderId, {
      include: [{ model: Goods, as: 'goods' }]
    });
    if (!order) {
      return res.json({ code: 404, message: '订单不存在' });
    }
    if (order.buyerId !== userId) {
      return res.json({ code: 403, message: '无权限操作' });
    }
    if (order.status !== 'pending') {
      return res.json({ code: 400, message: '订单状态错误' });
    }
    order.status = 'paid';
    order.payTime = new Date();
    await order.save();
    if (order.shareBy && order.commission > 0 && !order.commissionSettled) {
      const commission = await Commission.findOne({
        where: { orderId: order.id, userId: order.shareBy }
      });
      if (commission) {
        commission.status = 'available';
        commission.availableTime = new Date();
        await commission.save();
        await User.increment(
          { commission: commission.amount, availableCommission: commission.amount },
          { where: { id: order.shareBy } }
        );
      }
      order.commissionSettled = true;
      await order.save();
    }
    res.json({ code: 0, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '支付失败' });
  }
});

router.post('/ship', async (req, res) => {
  try {
    const { orderId, shippingCompany, shippingNo } = req.body;
    const userId = req.user.id;
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.json({ code: 404, message: '订单不存在' });
    }
    if (order.sellerId !== userId && !req.user.isAdmin) {
      return res.json({ code: 403, message: '无权限操作' });
    }
    if (order.status !== 'paid') {
      return res.json({ code: 400, message: '订单状态错误' });
    }
    order.status = 'shipped';
    order.shipTime = new Date();
    order.shippingCompany = shippingCompany;
    order.shippingNo = shippingNo;
    await order.save();
    res.json({ code: 0, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '发货失败' });
  }
});

router.post('/confirm', async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.json({ code: 404, message: '订单不存在' });
    }
    if (order.buyerId !== userId) {
      return res.json({ code: 403, message: '无权限操作' });
    }
    if (order.status !== 'shipped') {
      return res.json({ code: 400, message: '订单状态错误' });
    }
    order.status = 'completed';
    order.completeTime = new Date();
    await order.save();
    res.json({ code: 0, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '确认收货失败' });
  }
});

router.post('/delete', async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.json({ code: 404, message: '订单不存在' });
    }
    if (order.buyerId !== userId && order.sellerId !== userId && !req.user.isAdmin) {
      return res.json({ code: 403, message: '无权限操作' });
    }
    await order.destroy();
    res.json({ code: 0, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '删除失败' });
  }
});

module.exports = router;
