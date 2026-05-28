const express = require('express');
const FAQ = require('../models/FAQ');
const router = express.Router();

router.get('/list', async (req, res) => {
  try {
    const { category = '' } = req.query;
    const where = { status: 'active' };
    if (category) where.category = category;
    const list = await FAQ.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['id', 'DESC']]
    });
    const categories = await FAQ.findAll({
      attributes: ['category'],
      group: ['category']
    });
    const categoryList = categories.map(c => c.category).filter(Boolean);
    res.json({ code: 0, data: { list, categories: categoryList } });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取FAQ失败' });
  }
});

router.get('/detail', async (req, res) => {
  try {
    const { id } = req.query;
    const faq = await FAQ.findByPk(id);
    if (faq) {
      await faq.increment('viewCount');
    }
    res.json({ code: 0, data: faq });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '获取详情失败' });
  }
});

module.exports = router;
