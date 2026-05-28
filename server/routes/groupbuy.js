const express = require('express');
const { Goods, Group, GroupMember, Order, User } = require('../models');
const router = express.Router();

router.post('/join', async (req, res) => {
  try {
    const { goodsId, groupId } = req.body;
    const userId = req.user.id;
    const goods = await Goods.findByPk(goodsId);
    if (!goods || goods.type !== 'group') {
      return res.json({ code: 404, message: '拼团商品不存在' });
    }
    if (goods.status !== 'active') {
      return res.json({ code: 400, message: '活动已结束' });
    }
    if (goods.stock <= 0) {
      return res.json({ code: 400, message: '库存不足' });
    }
    const now = new Date();
    if (goods.endTime && new Date(goods.endTime) < now) {
      return res.json({ code: 400, message: '活动已结束' });
    }
    if (!goods.stepPrices || goods.stepPrices.length === 0) {
      return res.json({ code: 400, message: '拼团配置错误' });
    }
    let targetGroup = null;
    if (groupId) {
      targetGroup = await Group.findByPk(groupId);
      if (!targetGroup || targetGroup.status !== 'pending') {
        return res.json({ code: 400, message: '拼团已结束' });
      }
    }
    if (!targetGroup) {
      const pendingGroups = await Group.findAll({
        where: { goodsId, status: 'pending' },
        include: [{ model: GroupMember, as: 'members' }]
      });
      for (let g of pendingGroups) {
        const memberCount = g.members?.length || g.currentCount;
        if (memberCount < g.maxCount) {
          targetGroup = g;
          break;
        }
      }
    }
    const sortedSteps = [...goods.stepPrices].sort((a, b) => a.count - b.count);
    let currentPrice = sortedSteps[0].price;
    let maxCount = sortedSteps[0].count;
    if (targetGroup) {
      const newCount = targetGroup.currentCount + 1;
      for (let step of sortedSteps) {
        if (newCount >= step.count) {
          currentPrice = step.price;
          maxCount = step.count;
        }
      }
    } else {
      maxCount = sortedSteps[sortedSteps.length - 1].count;
    }
    if (!targetGroup) {
      targetGroup = await Group.create({
        goodsId,
        leaderId: userId,
        maxCount,
        currentCount: 1,
        price: currentPrice,
        endTime: goods.endTime
      });
    } else {
      targetGroup.currentCount += 1;
      targetGroup.price = currentPrice;
      targetGroup.maxCount = maxCount;
      await targetGroup.save();
    }
    const existingMember = await GroupMember.findOne({
      where: { groupId: targetGroup.id, userId }
    });
    if (existingMember) {
      return res.json({ code: 400, message: '您已参与此拼团' });
    }
    const orderNo = 'O' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const order = await Order.create({
      orderNo,
      type: 'group',
      goodsId,
      buyerId: userId,
      sellerId: goods.sellerId,
      amount: currentPrice,
      shippingFee: goods.shippingFee || 0,
      totalAmount: Number(currentPrice) + Number(goods.shippingFee || 0),
      quantity: 1,
      commission: goods.commission || 0,
      status: 'pending',
      groupId: targetGroup.id
    });
    await GroupMember.create({
      groupId: targetGroup.id,
      userId,
      orderId: order.id,
      isLeader: targetGroup.leaderId === userId
    });
    goods.joinedCount = (goods.joinedCount || 0) + 1;
    goods.stock -= 1;
    await goods.save();
    if (targetGroup.currentCount >= targetGroup.maxCount) {
      targetGroup.status = 'success';
      targetGroup.successTime = new Date();
      await targetGroup.save();
      const members = await GroupMember.findAll({ where: { groupId: targetGroup.id } });
      for (let member of members) {
        await Order.update({ status: 'paid' }, { where: { id: member.orderId } });
      }
    }
    res.json({ code: 0, data: { groupId: targetGroup.id, orderNo, price: currentPrice } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '拼团失败' });
  }
});

router.get('/groups', async (req, res) => {
  try {
    const { goodsId } = req.query;
    const groups = await Group.findAll({
      where: { goodsId, status: 'pending' },
      include: [
        {
          model: User,
          as: 'leader',
          attributes: ['id', 'nickname', 'avatar']
        },
        {
          model: GroupMember,
          as: 'members',
          include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'avatar'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ code: 0, data: { list: groups } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取拼团列表失败' });
  }
});

module.exports = router;
