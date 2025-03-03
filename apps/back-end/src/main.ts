/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 15:55:52
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/apps/back-end/src/main.ts
 */
import express from 'express';
// import { getAllNews } from './fetchNews';
import { getAllNews } from './fetchNewsWithPuppeteer';
import { generateReport } from './generateReport';
import { sendEmail } from './sendEmail';
import cron from 'node-cron';
import { SERVER } from './config';
import cors from 'cors'

const app = express();
// 启用CORS
app.use(cors({
  origin: 'http://localhost:4200', // 允许的前端源
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的HTTP方法
  allowedHeaders: ['Content-Type', 'Authorization'] // 允许的头信息
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

// 启动定时任务
newsArchiver.startScheduler();


// 添加手动触发存档的API端点
app.post('/archive-news', async (req, res) => {
  try {
    const filePath = await newsArchiver.manualArchive();
    res.json({ success: true, filePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加API端点来获取所有存档的新闻文件
app.get('/news-archives', async (req, res) => {
  try {
    const archiveDir = newsArchiver.config.archiveDir;
    const files = await fs.readdir(archiveDir);
    const archiveFiles = files
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        filename: file,
        date: file.replace('news-', '').replace('.md', ''),
        path: `/news-archives/${file}`
      }))
      .sort((a, b) => b.date.localeCompare(a.date)); // 最新的排在前面
    
    res.json(archiveFiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 添加静态服务来访问存档文件
app.use('/news-archives', express.static(newsArchiver.config.archiveDir));


// 处理应用程序关闭
process.on('SIGINT', () => {
  console.log('关闭服务器...');
  newsArchiver.stopScheduler();
  process.exit();
});