/*
 * @Author: Diana Tang
 * @Date: 2025-03-05 17:48:00
 * @LastEditors: Diana Tang
 * @Description: 新闻相关接口路由
 * @FilePath: /AI-Health-News-Agent-Back/src/routes/news-routes.ts
 */
import { Router, Request, Response, NextFunction } from 'express';
// import { getAllNews } from '../services/fetchNewsWithPuppeteer';
import { getAllNews } from "../services/getAllNews"
 import {RequestResult} from '../services/types'
const router = Router();

function filterSuccessItems<T extends { status: string }>(dataArray: T[]): T[] {
  // 使用filter方法筛选出status为"success"的项目
  return dataArray.filter(item => item.status === "success");
}
// 获取所有新闻的接口 - 支持任何 HTTP 方法
router.all("/news", (req: Request, res: Response, next: NextFunction) => {
  (async () =>{
    try {
      console.log(`收到 ${req.method} 请求: ${req.path}`);
      console.log('请求体:', req.body);  // 查看 POST 请求的数据
      console.log('查询参数:', req.query);  // 查看 URL 查询参数
      
      let newsData = await getAllNews();
      const successOnlyData = filterSuccessItems(newsData);
      const resp={ok:true, data: successOnlyData,status:200}
      console.log(`新闻数据获取成功，返回 ${successOnlyData.length || 0} 条记录`);
      
      return res.json(resp);
    } catch (error) {
      console.error('处理新闻请求时出错:', error);
      return res.status(500).json({ error: '获取新闻数据时发生错误' });
    }
  })()
});


// 这里可以添加更多与新闻相关的接口
// 例如：获取单条新闻、添加新闻、更新新闻、删除新闻等

export default router;