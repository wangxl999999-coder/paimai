const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { adminAuth, auth } = require('../middleware/auth');
const {
  User, Goods, Order, Commission, Withdraw, FAQ, BidRecord
} = require('../models');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ 
      where: { 
        phone: username, 
        isAdmin: true 
      } 
    });
    if (!user || user.password !== password) {
      return res.json({ code: 400, message: '用户名或密码错误' });
    }
    if (user.status !== 'active') {
      return res.json({ code: 400, message: '账号已被禁用' });
    }
    const token = require('jsonwebtoken').sign(
      { userId: user.id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      code: 200,
      data: {
        token,
        user: {
          id: user.id,
          username: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          role: user.isAdmin ? 'admin' : 'user'
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '登录失败' });
  }
});

router.use(adminAuth);

router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [
      totalUsers,
      totalGoods,
      totalOrders,
      totalAmount,
      todayUsers,
      todayOrders,
      todayAmount,
      totalCommission,
      pendingWithdraws
    ] = await Promise.all([
      User.count(),
      Goods.count(),
      Order.count({ where: { status: { [Op.ne]: 'cancelled' } } }),
      Order.sum('totalAmount', { where: { status: { [Op.in]: ['paid', 'shipped', 'completed'] } } }),
      User.count({ where: { createdAt: { [Op.gte]: today } } }),
      Order.count({ where: { createdAt: { [Op.gte]: today }, status: { [Op.ne]: 'cancelled' } } }),
      Order.sum('totalAmount', { where: { createdAt: { [Op.gte]: today }, status: { [Op.in]: ['paid', 'shipped', 'completed'] } } }),
      Commission.sum('amount'),
      Withdraw.count({ where: { status: 'pending' } })
    ]);

    res.json({
      code: 200,
      data: {
        totalUsers,
        totalGoods,
        totalOrders,
        totalAmount: totalAmount || 0,
        todayUsers,
        todayOrders,
        todayAmount: todayAmount || 0,
        totalCommission: totalCommission || 0,
        pendingWithdraws
      }
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取数据失败' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', status = '', role = '' } = req.query;
    const where = {};
    if (keyword) {
      where[Op.or] = [
        { nickname: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }
    if (status) where.status = status;
    if (role) where.role = role;
    
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    
    res.json({ 
      code: 200, 
      data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) } 
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取用户列表失败' });
  }
});

router.post('/users/status', async (req, res) => {
  try {
    const { id, status } = req.body;
    await User.update({ status }, { where: { id } });
    res.json({ code: 200, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '操作失败' });
  }
});

router.post('/users/upgrade', async (req, res) => {
  try {
    const { id } = req.body;
    await User.update({ role: 'seller' }, { where: { id } });
    res.json({ code: 200, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '升级失败' });
  }
});

router.get('/goods', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type = '', status = '', keyword = '', sellerKeyword = '' } = req.query;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (keyword) {
      where.title = { [Op.like]: `%${keyword}%` };
    }
    
    let include = [
      { model: User, as: 'seller', attributes: ['id', 'nickname', 'avatar'] }
    ];
    
    if (sellerKeyword) {
      include[0].where = {
        nickname: { [Op.like]: `%${sellerKeyword}%` }
      };
    }
    
    const { count, rows } = await Goods.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    
    res.json({ 
      code: 200, 
      data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) } 
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取商品列表失败' });
  }
});

router.get('/goods/hot', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const rows = await Goods.findAll({
      where: { status: 'active' },
      order: [['soldCount', 'DESC']],
      limit: Number(limit),
      attributes: ['id', 'title', 'images', 'soldCount', 'currentPrice', 'price']
    });
    
    const list = rows.map((item, index) => ({
      rank: index + 1,
      title: item.title,
      sales: item.soldCount || 0,
      amount: (item.soldCount || 0) * (item.currentPrice || item.price)
    }));
    
    res.json({ code: 200, data: { list } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取热卖商品失败' });
  }
});

router.post('/goods/offline', async (req, res) => {
  try {
    const { id } = req.body;
    await Goods.update({ status: 'offline' }, { where: { id } });
    res.json({ code: 200, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '下架失败' });
  }
});

router.post('/goods/online', async (req, res) => {
  try {
    const { id } = req.body;
    await Goods.update({ status: 'active' }, { where: { id } });
    res.json({ code: 200, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '上架失败' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status = '', orderNo = '', type = '', startDate = '', endDate = '' } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (orderNo) where.orderNo = { [Op.like]: `%${orderNo}%` };
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, [Op.lte]: end };
    }
    
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'nickname', 'avatar'] },
        { model: User, as: 'seller', attributes: ['id', 'nickname', 'avatar'] },
        { model: Goods, as: 'goods', attributes: ['id', 'title', 'images'] }
      ],
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    
    const list = rows.map(row => ({
      ...row.toJSON(),
      goodsTitle: row.goods?.title
    }));
    
    res.json({ 
      code: 200, 
      data: { list, total: count, page: Number(page), pageSize: Number(pageSize) } 
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取订单列表失败' });
  }
});

router.post('/orders/ship', async (req, res) => {
  try {
    const { id, expressNo = '', expressCompany = '' } = req.body;
    await Order.update(
      { status: 'shipped', expressNo, expressCompany, shippedAt: new Date() },
      { where: { id } }
    );
    res.json({ code: 200, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '发货失败' });
  }
});

router.get('/commissions', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status = '', userKeyword = '', startDate = '', endDate = '' } = req.query;
    const where = {};
    if (status) where.status = status;
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, [Op.lte]: end };
    }
    
    let include = [
      { model: User, as: 'user', attributes: ['id', 'nickname', 'avatar', 'phone'] },
      { model: User, as: 'fromUser', attributes: ['id', 'nickname'] },
      { model: Goods, as: 'goods', attributes: ['id', 'title'] },
      { model: Order, as: 'order', attributes: ['id', 'orderNo'] }
    ];
    
    if (userKeyword) {
      include[0].where = {
        [Op.or]: [
          { nickname: { [Op.like]: `%${userKeyword}%` } },
          { phone: { [Op.like]: `%${userKeyword}%` } }
        ]
      };
    }
    
    const { count, rows } = await Commission.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    
    const list = rows.map(row => ({
      ...row.toJSON(),
      goodsTitle: row.goods?.title,
      orderNo: row.order?.orderNo
    }));
    
    res.json({ 
      code: 200, 
      data: { list, total: count, page: Number(page), pageSize: Number(pageSize) } 
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取佣金列表失败' });
  }
});

router.get('/commissions/stats', async (req, res) => {
  try {
    const [totalAmount, settledAmount, pendingAmount] = await Promise.all([
      Commission.sum('amount'),
      Commission.sum('amount', { where: { status: 'settled' } }),
      Commission.sum('amount', { where: { status: 'pending' } })
    ]);
    
    res.json({
      code: 200,
      data: {
        totalAmount: totalAmount || 0,
        settledAmount: settledAmount || 0,
        pendingAmount: pendingAmount || 0
      }
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取统计失败' });
  }
});

router.get('/withdraws', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status = '', type = '', userKeyword = '' } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    
    let include = [
      { model: User, as: 'user', attributes: ['id', 'nickname', 'avatar', 'phone'] }
    ];
    
    if (userKeyword) {
      include[0].where = {
        [Op.or]: [
          { nickname: { [Op.like]: `%${userKeyword}%` } },
          { phone: { [Op.like]: `%${userKeyword}%` } }
        ]
      };
    }
    
    const { count, rows } = await Withdraw.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    
    const list = rows.map(row => ({
      ...row.toJSON(),
      actualAmount: row.amount - (row.fee || 0)
    }));
    
    res.json({ 
      code: 200, 
      data: { list, total: count, page: Number(page), pageSize: Number(pageSize) } 
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取提现列表失败' });
  }
});

router.get('/withdraws/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [pending, todayCount, todayAmount] = await Promise.all([
      Withdraw.count({ where: { status: 'pending' } }),
      Withdraw.count({ where: { createdAt: { [Op.gte]: today } } }),
      Withdraw.sum('amount', { where: { createdAt: { [Op.gte]: today } } })
    ]);
    
    res.json({
      code: 200,
      data: {
        pending,
        todayCount,
        todayAmount: todayAmount || 0
      }
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取统计失败' });
  }
});

router.post('/withdraws/approve', async (req, res) => {
  try {
    const { id } = req.body;
    const t = await require('../config/database').transaction();
    try {
      await Withdraw.update(
        { status: 'approved', auditTime: new Date(), auditUserId: req.user.id },
        { where: { id }, transaction: t }
      );
      await t.commit();
      res.json({ code: 200, data: null });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '审核失败' });
  }
});

router.post('/withdraws/reject', async (req, res) => {
  try {
    const { id, reason } = req.body;
    const withdraw = await Withdraw.findByPk(id);
    if (!withdraw) {
      return res.json({ code: 400, message: '记录不存在' });
    }
    
    const t = await require('../config/database').transaction();
    try {
      await Withdraw.update(
        { status: 'rejected', rejectReason: reason, auditTime: new Date(), auditUserId: req.user.id },
        { where: { id }, transaction: t }
      );
      
      await User.increment(
        { availableCommission: withdraw.amount, frozenCommission: -withdraw.amount },
        { where: { id: withdraw.userId }, transaction: t }
      );
      
      await t.commit();
      res.json({ code: 200, data: null });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '拒绝失败' });
  }
});

router.post('/withdraws/paid', async (req, res) => {
  try {
    const { id, payNo = '' } = req.body;
    await Withdraw.update(
      { status: 'paid', payTime: new Date(), payNo: payNo || 'PAY' + Date.now() },
      { where: { id } }
    );
    res.json({ code: 200, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '操作失败' });
  }
});

router.get('/faqs', async (req, res) => {
  try {
    const { page = 1, pageSize = 20, category = '', keyword = '', status = '' } = req.query;
    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (keyword) {
      where[Op.or] = [
        { question: { [Op.like]: `%${keyword}%` } },
        { answer: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    const { count, rows } = await FAQ.findAndCountAll({
      where,
      order: [['sortOrder', 'ASC'], ['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    
    res.json({ 
      code: 200, 
      data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) } 
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取FAQ失败' });
  }
});

router.get('/faqs/categories', async (req, res) => {
  try {
    const categories = await FAQ.findAll({
      attributes: [[fn('DISTINCT', col('category')), 'category']],
      where: { status: 'active' }
    });
    
    res.json({ 
      code: 200, 
      data: { categories: categories.map(c => c.category).filter(Boolean) } 
    });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取分类失败' });
  }
});

router.post('/faqs/create', async (req, res) => {
  try {
    const { category, question, answer, sort = 0, status = 'active' } = req.body;
    const faq = await FAQ.create({ 
      category: category || '通用', 
      question, 
      answer, 
      sortOrder: sort, 
      status 
    });
    res.json({ code: 200, data: { id: faq.id } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '创建失败: ' + err.message });
  }
});

router.post('/faqs/update', async (req, res) => {
  try {
    const { id, category, question, answer, sort, status } = req.body;
    await FAQ.update({ 
      category: category || '通用', 
      question, 
      answer, 
      sortOrder: sort, 
      status 
    }, { where: { id } });
    res.json({ code: 200, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '更新失败: ' + err.message });
  }
});

router.post('/faqs/status', async (req, res) => {
  try {
    const { id, status } = req.body;
    await FAQ.update({ status }, { where: { id } });
    res.json({ code: 200, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '操作失败' });
  }
});

router.post('/faqs/delete', async (req, res) => {
  try {
    const { id } = req.body;
    await FAQ.destroy({ where: { id } });
    res.json({ code: 200, data: null });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '删除失败' });
  }
});

module.exports = router;
