const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ code: 401, message: '未登录' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    if (!user || user.status === 'disabled') {
      return res.json({ code: 401, message: '账号已被禁用' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.json({ code: 401, message: '登录已过期，请重新登录' });
  }
};

module.exports.adminAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ code: 401, message: '未登录' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });
    if (!user || !user.isAdmin) {
      return res.json({ code: 403, message: '无权限访问' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.json({ code: 401, message: '登录已过期' });
  }
};
