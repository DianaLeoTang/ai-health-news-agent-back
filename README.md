# AI Health News Agent Backend

## 项目介绍

AI Health News Agent Backend 是一个专为获取和管理各大医学期刊健康信息设计的后端服务。该服务使用 TypeScript 和 Express.js 构建，提供了新闻抓取、归档、用户认证等功能，帮助医疗专业人员和研究人员及时获取最新的健康资讯。

## 功能特点

- **自动抓取新闻**: 定时从各大医学期刊网站获取最新健康信息
- **新闻归档**: 将重要的健康新闻进行分类归档
- **用户管理**: 支持用户注册、登录和权限管理
- **报告生成**: 自动生成健康新闻摘要报告
- **邮件通知**: 支持重要更新的邮件通知功能

## 技术栈

- Node.js
- TypeScript
- Express.js
- Puppeteer (用于网页抓取)
- JWT (用于认证)

## 项目结构

```
my-express-ts-backend/
├── src/
│   ├── routes/                # 路由定义
│   │   ├── archive-routes.ts  # 归档相关路由
│   │   ├── auth-routes.ts     # 认证相关路由
│   │   ├── home-routes.ts     # 首页相关路由
│   │   ├── news-routes.ts     # 新闻相关路由
│   │   └── user-routes.ts     # 用户相关路由
│   ├── services/              # 服务层实现
│   │   ├── scheduler.ts       # 定时任务调度器
│   │   ├── ArchiveController.ts  # 归档控制器
│   │   ├── config.ts          # 配置文件
│   │   ├── fetchNewsWithPuppeteer.ts  # 新闻抓取服务
│   │   ├── generateReport.ts  # 报告生成服务
│   │   ├── main.ts            # 旧版入口文件
│   │   ├── NewsArchiver.ts    # 新闻归档服务
│   │   └── sendEmail.ts       # 邮件发送服务
│   ├── app.ts                 # Express应用配置
│   └── server.ts              # 服务器入口
├── .env                       # 环境变量
├── .gitignore
├── package.json
└── tsconfig.json
```

## 安装与运行

### 前置条件

- Node.js (>= 14.x)
- npm 或 yarn
- MongoDB (可选，取决于配置)

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/ai-health-news-agent-backend.git
cd ai-health-news-agent-backend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env` 文件并填入必要的配置:
```
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
# 其他配置...
```

4. 运行开发环境
```bash
npm run dev
```

5. 构建生产环境
```bash
npm run build
```

6. 运行生产环境
```bash
npm start
```

## API 端点

- `GET /home` - 获取首页内容
- `GET /news` - 获取所有新闻
- `GET /news/:id` - 获取特定新闻
- `POST /news/fetch` - 手动触发新闻抓取
- `GET /archives` - 获取归档列表
- `POST /auth/login` - 用户登录
- `POST /auth/register` - 用户注册
- `GET /users/profile` - 获取用户资料

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

[MIT](LICENSE)

## 联系方式

Diana Tang - [wangyaotang0228@gmail.com](mailto:wangyaotang0228@gmail.com)

项目链接: [https://github.com/DianaLeoTang/ai-health-news-agent-back](https://github.com/DianaLeoTang/ai-health-news-agent-back)