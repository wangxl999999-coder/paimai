const express = require('express');
const { Goods, BidRecord, Order, User } = require('../models');
const router = express.Router();

router.post('/bid', async (req, res) => {
  try {
    const { goodsId, amount } = req.body;
    const userId = req.user.id;
    const goods = await Goods.findByPk(goodsId);
    if (!goods || goods.type !== 'auction') {
      return res.json({ code: 404, message: '拍卖不存在' });
    }
    if (goods.status !== 'active') {
      return res.json({ code: 400, message: '拍卖已结束' });
    }
    const now = new Date();
    if (goods.endTime && new Date(goods.endTime) < now) {
      return res.json({ code: 400, message: '拍卖已结束' });
    }
    if (goods.sellerId === userId) {
      return res.json({ code: 400, message: '不能竞拍自己的商品' });
    }
    const minBid = Number(goods.currentPrice) + Number(goods.minIncrement);
    if (Number(amount) < minBid) {
      return res.json({ code: 400, message: `出价不能低于${minBid}元` });
    }
    await BidRecord.update({ isMax: false }, { where: { goodsId, isMax: true } });
    await BidRecord.create({
      goodsId,
      userId,
      amount,
      ip: req.ip
    });
    goods.currentPrice = amount;
    goods.bidCount = (goods.bidCount || 0) + 1;
    await goods.save();
    if (goods.endTime) {
      const endTime = new Date(goods.endTime);
      if (endTime - now < 5 * 60 * 1000) {
        endTime.setMinutes(endTime.getMinutes() + 5);
        goods.endTime = endTime;
        await goods.save();
      }
    }
    res.json({ code: 0, data: { currentPrice: amount } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '出价失败' });
  }
});

router.post('/settle', async (req, res) => {
  try {
    const { goodsId } = req.body;
    const goods = await Goods.findByPk(goodsId);
    if (!goods || goods.type !== 'auction' || goods.status !== 'active') {
      return res.json({ code: 400, message: '拍卖状态错误' });
    }
    const now = new Date();
    if (goods.endTime && new Date(goods.endTime) > now) {
      return res.json({ code: 400, message: '拍卖尚未结束' });
    }
    const maxBid = await BidRecord.findOne({
      where: { goodsId, isMax: true },
      include: [{ model: User, as: 'user' }]
    });
    if (!maxBid) {
      goods.status = 'ended';
      await goods.save();
      return res.json({ code: 0, data: { message: '无人竞拍' } });
    }
    if (goods.reservePrice && Number(maxBid.amount) < Number(goods.reservePrice)) {
      goods.status = 'ended';
      await goods.save();
      return res.json({ code: 0, data: { message: '未达到保留价' } });
    }
    const orderNo = 'O' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();
    await Order.create({
      orderNo,
      type: 'auction',
      goodsId,
      buyerId: maxBid.userId,
      sellerId: goods.sellerId,
      amount: maxBid.amount,
      shippingFee: goods.shippingFee || 0,
      totalAmount: Number(maxBid.amount) + Number(goods.shippingFee || 0),
      quantity: 1,
      commission: goods.commission || 0,
      status: 'pending',
      bidAmount: maxBid.amount,
      isWinner: true
    });
    goods.status = 'sold';
    goods.winnerId = maxBid.userId;
    await goods.save();
    res.json({ code: 0, data: { orderNo, winner: maxBid.user, amount: maxBid.amount } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '结算失败' });
  }
});

module.exports = router;
