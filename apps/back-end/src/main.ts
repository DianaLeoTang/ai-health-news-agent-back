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