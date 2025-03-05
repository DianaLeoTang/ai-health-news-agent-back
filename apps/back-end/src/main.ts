/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 15:55:52
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/apps/back-end/src/main.ts
 */
import express from 'express';
import cors from 'cors'
import * as path from 'path';
import cron from 'node-cron';

// import { getAllNews } from './fetchNews';
import { getAllNews } from './fetchNewsWithPuppeteer';
import { generateReport } from './generateReport';
import { sendEmail } from './sendEmail';
import { SERVER } from './config';
// import NewsArchiver from './NewsArchiver';
// import ArchiveController from './ArchiveController';

const app = express();
// 启用CORS
app.use(cors({
  origin: ['http://localhost:8000', 'http://localhost:4200'], // 允许的前端源
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的HTTP方法
  allowedHeaders: ['Content-Type', 'Authorization'], // 允许的头信息
  credentials: true // 允许跨域请求携带凭证（如cookies）
}));

app.get("/news", async (req, res) => {
  let newsData = await getAllNews();
  res.json(newsData);
});

app.get("/", (req, res) => {
  res.send(
    '<h1>Welcome to AI-Health-News-Agent</h1><p>Use <a href="/news">/news</a> to get the latest public health news.</p>'
  );
});

cron.schedule("0 8 * * *", async () => {
  console.log("Running scheduled news update...");
  let newsData = await getAllNews();
  await generateReport(newsData);
  await sendEmail();
});

app.listen(SERVER.PORT, () => {
  console.log(`Server running on http://localhost:${SERVER.PORT}`);
});

// // 初始化新闻存档服务
// const newsArchiver = new NewsArchiver({
//   apiUrl: 'http://localhost:3000/news', // 此处使用自己的API路径
//   archiveDir: path.join(process.cwd(), 'news-archives'),
//   scheduleCron: '0 0 * * *' // 每天午夜执行
// });
// 启动定时任务
// newsArchiver.startScheduler();
// 初始化控制器
// const archiveController = new ArchiveController(newsArchiver);

// // 存档相关API
// app.post('/archives/trigger', archiveController.manualArchive);
// app.get('/archives', archiveController.getArchives);
// app.get('/archives/:filename', archiveController.getArchiveContent);

// 提供静态文件访问
// app.use('/static/archives', express.static(newsArchiver.getArchiveDir()));

// // 处理应用程序关闭
// process.on('SIGINT', () => {
//   console.log('关闭服务器...');
//   newsArchiver.stopScheduler();
//   process.exit();
// });