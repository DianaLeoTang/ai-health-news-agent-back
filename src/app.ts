/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 15:55:52
 * @LastEditors: Diana Tang
 * @Description: 应用程序入口文件
 * @FilePath: /AI-Health-News-Agent-Back/src/app.ts
 */
import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();
// import 'dotenv/config';

// 导入路由
import newsRoutes from './routes/news-routes';
import homeRoutes from './routes/home-routes';
import archiveRoutes from './routes/archive-routes';
import authRoutes from './routes/auth-routes';
import userRoutes from './routes/user-routes';
import fileRoutes from './routes/file-routes';
import pdfRoutes from './routes/pdf-routes';

import errorHandler from './middleware/error-handler';

// 创建Express应用
const app = express();

// 配置CORS
app.use(cors({
  origin: [
    'http://localhost:8000', 
    'http://localhost:4200',
    'https://aihealthnews.netlify.app',
    'https://aihealthnews.netlify.app/',
    'https://aihealthnews.duckdns.org',
    'https://www.aihealthnews.duckdns.org'
  ], // 允许的前端源
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 添加OPTIONS方法
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // 添加Accept头
  credentials: true 
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
app.use(fileRoutes);
app.use(pdfRoutes);
app.use(errorHandler);

export default app;