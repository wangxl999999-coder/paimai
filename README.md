# 拍卖微信小程序

一个功能完整的拍卖类微信小程序，支持多种交易模式。

## 功能特性

### 四种交易形式
- **竞价拍卖**：个人闲置物品、技能服务拍卖，支持出价竞拍
- **一口价**：创建商品并在个人店铺中出售
- **阶梯拼团**：商家拼团工具，人越多越便宜
- **秒杀活动**：选择商品后，限时、限量促销

### 用户功能
- 首页以店铺形式展示商品
- 订阅发布者最新动态
- 商品详情页分享赚佣金
- 已参与模块：查看发起或参与过的拍卖
- 我的页面：个人拍卖数据、帮卖赚佣金明细
- 常见问题、联系客服

### 发布者功能
- 福利拍卖和店铺好物管理
- 商品发布和管理

### 管理后台
- 数据看板
- 订单管理
- 用户管理
- 佣金列表
- 用户提现审核
- 常见问题维护
- 用户店铺商品列表

## 项目结构

```
paimai/
├── miniprogram/          # 微信小程序前端
├── server/               # Node.js 后端服务
├── admin/                # 管理后台 (Vue.js)
└── package.json          # 根配置
```

## 快速开始

### 安装依赖
```bash
npm run install:all
```

### 启动后端服务 (端口: 3003)
```bash
npm run dev:server
```

### 启动管理后台 (端口: 3001-3002)
```bash
npm run dev:admin
```
管理后台访问: http://localhost:3001/ 或 http://localhost:3002/ (如3001被占用)

### 运行小程序
使用微信开发者工具导入 `miniprogram` 目录

## 技术栈

### 小程序前端
- **框架**: 微信小程序原生 (WXML + WXSS + JavaScript)
- **状态管理**: 全局App.globalData
- **网络请求**: 统一封装的request方法
- **特色功能**: 倒计时、图片上传、分享海报、WebSocket实时出价

### 后端服务
- **框架**: Node.js + Express
- **数据库**: SQLite (Sequelize ORM)
- **认证**: JWT (JSON Web Token)
- **文件上传**: Multer
- **特色功能**: 
  - 竞价拍卖: 实时出价、自动结拍、保证金管理
  - 阶梯拼团: 多级价格、自动成团、失败退款
  - 秒杀活动: 库存预扣、超时释放、防超卖
  - 佣金系统: 二级分销、自动结算、提现审核

### 管理后台
- **框架**: Vue 3 + Vite
- **UI组件**: Element Plus
- **状态管理**: Pinia
- **图表**: ECharts
- **路由**: Vue Router 4
- **特色功能**: 
  - 数据看板: 实时统计、趋势图表
  - 订单管理: 订单查询、发货、详情
  - 用户管理: 列表、状态、升级商家
  - 佣金管理: 明细、统计、导出
  - 提现审核: 多级审核、打款标记
  - FAQ维护: 分类管理、增删改查
  - 商品管理: 上下架、筛选

## 数据库模型

### User (用户表)
- 基本信息: 手机号、昵称、头像、密码
- 财务: 余额、累计佣金、可提现佣金、冻结佣金
- 店铺: 店铺名称、店铺描述、是否有福利
- 状态: 认证状态、管理员状态、粉丝数、关注数

### Goods (商品表)
- 基本信息: 标题、描述、图片、分类
- 类型: auction(竞价)/fixed(一口价)/group(拼团)/seckill(秒杀)
- 价格: 起拍价、当前价、原价、加价幅度
- 库存: 总库存、已售数量、浏览次数
- 时间: 开始时间、结束时间
- 关联: 卖家ID、是否福利商品

### Order (订单表)
- 订单信息: 订单号、商品ID、买家ID、卖家ID
- 交易: 单价、数量、总金额、支付方式
- 状态: pending(待付)/paid(已付)/shipped(已发)/completed(完成)/cancelled(取消)
- 物流: 收货地址、物流公司、物流单号

### Commission (佣金表)
- 信息: 用户ID、来源用户ID、订单ID、商品ID
- 金额: 佣金金额、层级(1/2级)
- 状态: available(可提)/pending(待生效)/settled(已结算)/cancelled(取消)

### Withdraw (提现表)
- 信息: 用户ID、提现金额、手续费、实付金额
- 方式: wechat/alipay/bank、账号、姓名
- 状态: pending(待审)/approved(已过)/paid(已打)/rejected(拒绝)

### FAQ (常见问题)
- 分类、问题、答案、排序、状态、查看次数

## 管理后台默认账号
- **账号**: `admin`
- **密码**: `123456`

## 小程序页面列表

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | pages/index/index | 店铺展示、商品列表、分类导航 |
| 商品详情 | pages/detail/detail | 商品信息、出价/购买/参团、分享 |
| 发布商品 | pages/publish/publish | 四种类型商品发布 |
| 已参与 | pages/participated/participated | 我发布的、我拍到的、我买到的 |
| 我的 | pages/mine/mine | 个人中心、数据统计、功能入口 |
| 登录 | pages/login/login | 微信登录、手机号登录 |
| 店铺 | pages/store/store | 商家主页、商品分类、订阅 |
| 佣金 | pages/commission/commission | 佣金明细、状态筛选 |
| 提现 | pages/withdraw/withdraw | 提现申请、提现记录 |
| 常见问题 | pages/faq/faq | 分类FAQ、展开收起 |
| 联系客服 | pages/contact/contact | 联系方式、意见反馈 |
| 搜索 | pages/search/search | 关键词搜索、历史记录 |
| 我的订阅 | pages/subscribe/subscribe | 订阅列表、取消订阅 |
| 福利拍卖 | pages/welfare/welfare | 福利商品专区 |

## 管理后台页面列表

| 页面 | 路径 | 说明 |
|------|------|------|
| 登录 | /login | 管理员登录 |
| 数据看板 | /dashboard | 统计卡片、趋势图、分布图 |
| 订单管理 | /orders | 订单列表、详情、发货 |
| 用户管理 | /users | 用户列表、状态、升级商家 |
| 佣金列表 | /commissions | 佣金明细、统计、导出 |
| 提现审核 | /withdraws | 审核、拒绝、标记打款 |
| FAQ维护 | /faqs | 增删改查、分类管理 |
| 商品列表 | /goods | 商品列表、上下架 |

## API 接口概览

### 认证相关
- `POST /api/auth/login` - 手机号登录
- `POST /api/auth/register` - 注册
- `POST /api/auth/wx-login` - 微信登录

### 商品相关
- `GET /api/goods/list` - 商品列表
- `GET /api/goods/detail` - 商品详情
- `POST /api/goods/publish` - 发布商品
- `POST /api/goods/offline` - 下架商品

### 拍卖相关
- `POST /api/auction/bid` - 出价
- `GET /api/auction/records` - 出价记录

### 拼团相关
- `POST /api/groupbuy/join` - 参团
- `GET /api/groupbuy/detail` - 拼团详情

### 秒杀相关
- `POST /api/seckill/buy` - 秒杀购买

### 订单相关
- `GET /api/order/list` - 订单列表
- `POST /api/order/pay` - 支付
- `POST /api/order/confirm` - 确认收货

### 用户相关
- `GET /api/user/info` - 用户信息
- `GET /api/user/stats` - 用户统计
- `GET /api/user/commissions` - 佣金列表
- `GET /api/user/withdraws` - 提现记录
- `POST /api/user/withdraw` - 申请提现
- `POST /api/user/subscribe` - 订阅店铺
- `POST /api/user/unsubscribe` - 取消订阅

### 管理后台
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/stats` - 数据统计
- `GET /api/admin/orders` - 订单列表
- `POST /api/admin/orders/ship` - 发货
- `GET /api/admin/users` - 用户列表
- `POST /api/admin/users/status` - 用户状态
- `POST /api/admin/users/upgrade` - 升级商家
- `GET /api/admin/commissions` - 佣金列表
- `GET /api/admin/commissions/stats` - 佣金统计
- `GET /api/admin/withdraws` - 提现列表
- `POST /api/admin/withdraws/approve` - 通过提现
- `POST /api/admin/withdraws/reject` - 拒绝提现
- `POST /api/admin/withdraws/paid` - 标记打款
- `GET /api/admin/faqs` - FAQ列表
- `POST /api/admin/faqs/create` - 创建FAQ
- `POST /api/admin/faqs/update` - 更新FAQ
- `POST /api/admin/faqs/delete` - 删除FAQ
- `GET /api/admin/goods` - 商品列表
- `POST /api/admin/goods/offline` - 下架商品
- `POST /api/admin/goods/online` - 上架商品

## 注意事项

1. **小程序域名配置**: 小程序后台需要配置request合法域名和uploadFile合法域名
2. **图片上传**: 支持jpg/png格式，单张不超过5MB
3. **提现规则**: 最低提现10元，手续费1%，T+7到账
4. **佣金结算**: 订单完成后7天自动结算到可提现余额
5. **拍卖规则**: 价高者得，拍卖结束后24小时内未付款自动取消
6. **拼团规则**: 拼团失败自动退款，拼团有效期24小时
7. **秒杀规则**: 秒杀商品不支持退款，每人限购1件

## License

MIT
