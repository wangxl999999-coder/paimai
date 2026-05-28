const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { phone, password, code } = req.body;
    if (code) {
      const user = await loginByCode(code, req);
      return res.json({ code: 0, data: generateToken(user) });
    }
    if (!phone || !password) {
      return res.json({ code: 400, message: '请输入账号密码' });
    }
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.json({ code: 400, message: '账号不存在' });
    }
    if (user.status === 'disabled') {
      return res.json({ code: 400, message: '账号已被禁用' });
    }
    if (!user.password) {
      return res.json({ code: 400, message: '请使用微信登录' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({ code: 400, message: '密码错误' });
    }
    user.lastLoginTime = new Date();
    user.lastLoginIp = req.ip;
    await user.save();
    const userData = user.toJSON();
    delete userData.password;
    res.json({ code: 0, data: generateToken(userData) });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '登录失败' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { phone, password, nickname } = req.body;
    if (!phone || !password) {
      return res.json({ code: 400, message: '请填写完整信息' });
    }
    const existing = await User.findOne({ where: { phone } });
    if (existing) {
      return res.json({ code: 400, message: '手机号已注册' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      phone,
      password: hashedPassword,
      nickname: nickname || `用户${phone.slice(-4)}`
    });
    const userData = user.toJSON();
    delete userData.password;
    res.json({ code: 0, data: generateToken(userData) });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '注册失败' });
  }
});

router.post('/wx-login', async (req, res) => {
  try {
    const { code, avatarUrl, nickName } = req.body;
    if (!code) {
      return res.json({ code: 400, message: '缺少code' });
    }
    let openid = 'mock_' + code;
    let user = await User.findOne({ where: { openid } });
    if (!user) {
      user = await User.create({
        openid,
        nickname: nickName || '微信用户',
        avatar: avatarUrl
      });
    } else {
      if (avatarUrl) user.avatar = avatarUrl;
      if (nickName) user.nickname = nickName;
      user.lastLoginTime = new Date();
      await user.save();
    }
    const userData = user.toJSON();
    delete userData.password;
    res.json({ code: 0, data: generateToken(userData) });
  } catch (err) {
    console.error(err);
    res.json({ code: 500, message: '微信登录失败' });
  }
});

function generateToken(user) {
  const token = jwt.sign(
    { userId: user.id, phone: user.phone, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  return { token, user };
}

async function loginByCode(code, req) {
  let openid = 'mock_' + code;
  let user = await User.findOne({ where: { openid } });
  if (!user) {
    user = await User.create({
      openid,
      nickname: '测试用户'
    });
  }
  user.lastLoginTime = new Date();
  user.lastLoginIp = req.ip;
  await user.save();
  const userData = user.toJSON();
  delete userData.password;
  return userData;
}

module.exports = router;
