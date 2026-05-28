require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, process.env.UPLOAD_PATH || './uploads');
const dataDir = path.join(__dirname, './data');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadDir));

const sequelize = require('./config/database');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/error');

sequelize.sync({ alter: true }).then(() => {
  console.log('数据库连接成功');
  require('./scripts/init-admin')();
}).catch(err => {
  console.error('数据库连接失败:', err);
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/goods', require('./routes/goods'));
app.use('/api/auction', authMiddleware, require('./routes/auction'));
app.use('/api/groupbuy', authMiddleware, require('./routes/groupbuy'));
app.use('/api/seckill', authMiddleware, require('./routes/seckill'));
app.use('/api/order', authMiddleware, require('./routes/order'));
app.use('/api/user', authMiddleware, require('./routes/user'));
app.use('/api/upload', authMiddleware, require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/faq', require('./routes/faq'));

app.get('/api/health', (req, res) => {
  res.json({ code: 0, data: { status: 'ok', time: new Date().toISOString() } });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;
