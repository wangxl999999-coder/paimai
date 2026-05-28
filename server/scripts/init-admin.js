const User = require('../models/User');

module.exports = async () => {
  try {
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || '123456';
    
    const existing = await User.findOne({ where: { phone: adminUser } });
    if (!existing) {
      await User.create({
        phone: adminUser,
        nickname: '管理员',
        password: adminPass,
        isAdmin: true,
        isVerified: true,
        status: 'active'
      });
      console.log('管理员账号创建成功:', adminUser, '/', adminPass);
    }
  } catch (err) {
    console.error('初始化管理员失败:', err);
  }
};
