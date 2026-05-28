require('dotenv').config();
const { User } = require('../models');
const sequelize = require('../config/database');

async function checkAndFixAdmin() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || '123456';

    console.log('检查管理员账号...');
    let admin = await User.findOne({ where: { phone: adminUser } });

    if (admin) {
      console.log('找到管理员账号:', admin.phone);
      console.log('当前密码:', admin.password);
      console.log('isAdmin:', admin.isAdmin);
      console.log('status:', admin.status);

      if (admin.password !== adminPass) {
        console.log('密码不匹配，更新密码...');
        await admin.update({ password: adminPass });
        console.log('密码已更新为:', adminPass);
      }
      if (!admin.isAdmin) {
        console.log('isAdmin为false，更新为true...');
        await admin.update({ isAdmin: true });
      }
      if (admin.status !== 'active') {
        console.log('状态不是active，更新...');
        await admin.update({ status: 'active' });
      }
    } else {
      console.log('未找到管理员账号，创建新账号...');
      admin = await User.create({
        phone: adminUser,
        nickname: '管理员',
        password: adminPass,
        isAdmin: true,
        isVerified: true,
        status: 'active'
      });
      console.log('管理员账号创建成功:', adminUser, '/', adminPass);
    }

    console.log('\n=== 验证登录 ===');
    const verify = await User.findOne({ where: { phone: adminUser, isAdmin: true } });
    console.log('验证结果:', verify ? '通过' : '失败');
    if (verify) {
      console.log('密码验证:', verify.password === adminPass ? '通过' : '失败');
      console.log('账号:', verify.phone);
      console.log('密码:', verify.password);
      console.log('isAdmin:', verify.isAdmin);
      console.log('status:', verify.status);
    }

    process.exit(0);
  } catch (err) {
    console.error('检查失败:', err);
    process.exit(1);
  }
}

checkAndFixAdmin();
