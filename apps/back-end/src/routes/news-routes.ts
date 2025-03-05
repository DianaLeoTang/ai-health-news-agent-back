/*
 * @Author: Diana Tang
 * @Date: 2025-03-05 17:48:00
 * @LastEditors: Diana Tang
 * @Description: 新闻相关接口路由
 * @FilePath: /AI-Health-News-Agent/apps/back-end/src/routes/news-routes.ts
 */
import {Router} from 'express';
import { getAllNews } from '../fetchNewsWithPuppeteer';

const router = Router();

// 获取所有新闻的接口
router.get("/news", async (req, res) => {
  let newsData = await getAllNews();
  res.json(newsData);
});

// 这里可以添加更多与新闻相关的接口
// 例如：获取单条新闻、添加新闻、更新新闻、删除新闻等

export default router;