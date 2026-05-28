const express = require('express');
const { Op, literal } = require('sequelize');
const { Goods, User, BidRecord, Order } = require('../models');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type = '', keyword = '', category = '', sellerId = '' } = req.query;
    const where = { status: 'active' };
    if (type) where.type = type;
    if (category) where.category = category;
    if (sellerId) where.sellerId = sellerId;
    const now = new Date();
    where.startTime = { [Op.lte]: now };
    const timeConditions = [
      { endTime: null },
      { endTime: { [Op.gt]: now } }
    ];
    if (keyword) {
      where[Op.and] = [
        {
          [Op.or]: [
            { title: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } }
          ]
        },
        {
          [Op.or]: timeConditions
        }
      ];
    } else {
      where[Op.or] = timeConditions;
    }
    const { count, rows } = await Goods.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'nickname', 'avatar', 'isVerified', 'hasWelfare', 'fansCount']
        }
      ],
      order: [
        ['topOrder', 'DESC'],
        ['createdAt', 'DESC']
      ],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    for (let goods of rows) {
      await goods.increment('viewCount');
    }
    const list = rows.map(item => {
      const data = item.toJSON();
      if (data.type === 'group' && data.stepPrices) {
        data.stepPrices = data.stepPrices.map(s => ({
          ...s,
          reached: data.joinedCount >= s.count
        }));
      }
      return data;
    });
    res.json({ code: 0, data: { list, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取商品列表失败' });
  }
});

router.get('/detail', async (req, res) => {
  try {
    const { id } = req.query;
    const goods = await Goods.findByPk(id, {
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'nickname', 'avatar', 'isVerified', 'hasWelfare', 'fansCount', 'storeName', 'storeDesc']
        }
      ]
    });
    if (!goods) {
      return res.json({ code: 404, message: '商品不存在' });
    }
    await goods.increment('viewCount');
    const data = goods.toJSON();
    if (data.type === 'group' && data.stepPrices) {
      data.stepPrices = data.stepPrices.map(s => ({
        ...s,
        reached: data.joinedCount >= s.count
      }));
    }
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { Subscribe } = require('../models');
        const subscribed = await Subscribe.findOne({
          where: { userId: decoded.userId, publisherId: goods.sellerId }
        });
        data.isSubscribed = !!subscribed;
      } catch (e) {}
    }
    res.json({ code: 0, data });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取商品详情失败' });
  }
});

router.post('/publish', authMiddleware, async (req, res) => {
  try {
    const goodsData = {
      ...req.body,
      sellerId: req.user.id
    };
    if (!goodsData.startTime) {
      goodsData.startTime = new Date();
    }
    if (goodsData.type !== 'fixed' && !goodsData.endTime && goodsData.duration) {
      const endTime = new Date(goodsData.startTime);
      endTime.setDate(endTime.getDate() + Number(goodsData.duration));
      goodsData.endTime = endTime;
    }
    goodsData.currentPrice = goodsData.startPrice || goodsData.price;
    goodsData.status = 'active';
    const goods = await Goods.create(goodsData);
    res.json({ code: 0, data: { id: goods.id } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '发布失败' });
  }
});

router.post('/offline', authMiddleware, async (req, res) => {
  try {
    const { goodsId } = req.body;
    const goods = await Goods.findByPk(goodsId);
    if (!goods) {
      return res.json({ code: 404, message: '商品不存在' });
    }
    if (goods.sellerId !== req.user.id && !req.user.isAdmin) {
      return res.json({ code: 403, message: '无权限操作' });
    }
    goods.status = 'ended';
    await goods.save();
    res.json({ code: 0, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '下架失败' });
  }
});

router.get('/bid-records', async (req, res) => {
  try {
    const { goodsId, page = 1, pageSize = 20 } = req.query;
    const { count, rows } = await BidRecord.findAndCountAll({
      where: { goodsId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    const list = rows.map(item => {
      const data = item.toJSON();
      data.timeText = formatTime(item.createdAt);
      return data;
    });
    res.json({ code: 0, data: { list, total: count } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取出价记录失败' });
  }
});

router.get('/comments', async (req, res) => {
  res.json({ code: 0, data: { list: [] } });
});

function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 2592000000) return Math.floor(diff / 86400000) + '天前';
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

module.exports = router;
