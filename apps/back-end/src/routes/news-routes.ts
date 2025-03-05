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

// // 获取所有新闻的接口
// router.all("/news", async (req, res) => {
//   let newsData = await getAllNews();
//   console.log('新闻',req)
//   res.json(newsData);
// });
// 获取所有新闻的接口 - 支持任何 HTTP 方法
router.all("/news", async (req, res) => {
  try {
    console.log(`收到 ${req.method} 请求: ${req.path}`);
    console.log('请求体:', req.body);  // 查看 POST 请求的数据
    console.log('查询参数:', req.query);  // 查看 URL 查询参数
    
    let newsData = await getAllNews();
    const resp={ok:true, data: newsData,status:200}
    console.log(`新闻数据获取成功，返回 ${newsData.length || 0} 条记录`);
    
    return res.json(resp);
  } catch (error) {
    console.error('处理新闻请求时出错:', error);
    return res.status(500).json({ error: '获取新闻数据时发生错误' });
  }
});


// 这里可以添加更多与新闻相关的接口
// 例如：获取单条新闻、添加新闻、更新新闻、删除新闻等

export default router;