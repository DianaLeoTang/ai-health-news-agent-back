/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 15:55:52
 * @LastEditors: Diana Tang
 * @Description: 应用程序入口文件
 * @FilePath: /AI-Health-News-Agent/apps/back-end/src/main.ts
 */
import express from 'express';
import cors from 'cors';

// 导入配置
import { SERVER } from './config';

// 导入路由
import newsRoutes from './routes/news-routes';
import homeRoutes from './routes/home-routes';
import archiveRoutes from './routes/archive-routes';
import authRoutes from './routes/auth-routes';
import userRoutes from './routes/user-routes';

// 导入服务
import { scheduler } from './services/scheduler';

// 创建Express应用
const app = express();

// 配置CORS
app.use(cors({
  origin: ['http://localhost:8000', 'http://localhost:4200'], // 允许的前端源
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的HTTP方法
  allowedHeaders: ['Content-Type', 'Authorization'], // 允许的头信息
  credentials: true // 允许跨域请求携带凭证（如cookies）
}));


// 解析请求体中的JSON数据
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 应用路由
app.use(homeRoutes);
app.use(newsRoutes);
app.use(archiveRoutes);
app.use(userRoutes); // 注意：需要在authRoutes之前加载，确保setAccess方法可用
app.use(authRoutes);

// 初始化定时任务
scheduler.initialize();

// 启动服务器
app.listen(SERVER.PORT, () => {
  console.log(`Server running on http://localhost:${SERVER.PORT}`);
});

// 处理应用程序关闭
process.on('SIGINT', () => {
  console.log('关闭服务器...');
  scheduler.stopAll();
  // 如果存档服务实现，则取消注释以下代码
  // import { archiveService } from './routes/archive-routes';
  // archiveService.stopScheduler();
  process.exit();
});