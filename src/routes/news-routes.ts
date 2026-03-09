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

function filterSuccessItems(dataArray: RequestResult[]): RequestResult[] {
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


// WHO专用爬虫接口
import { fetchAllWHONews, fetchLatestWHONews, fetchWHONewsRange } from '../services/whoNewsCrawler';

/**
 * 获取WHO所有分页新闻
 * GET /who-news/all?maxPages=5&startPage=1&delayMs=1000
 */
router.get("/who-news/all", (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const maxPages = parseInt(req.query.maxPages as string) || undefined;
      const startPage = parseInt(req.query.startPage as string) || 1;
      const delayMs = parseInt(req.query.delayMs as string) || 1000;

      console.log(`开始抓取WHO新闻: maxPages=${maxPages}, startPage=${startPage}`);
      
      const result = await fetchAllWHONews({
        maxPages,
        startPage,
        delayMs
      });

      return res.json({
        ok: true,
        data: result,
        status: 200
      });
    } catch (error) {
      console.error('获取WHO新闻失败:', error);
      return res.status(500).json({ 
        ok: false,
        error: '获取WHO新闻数据时发生错误',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  })();
});

/**
 * 获取WHO最新N条新闻（快速模式）
 * GET /who-news/latest?count=50
 */
router.get("/who-news/latest", (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const count = parseInt(req.query.count as string) || 50;
      
      console.log(`快速获取WHO最新 ${count} 条新闻`);
      
      const result = await fetchLatestWHONews(count);

      return res.json({
        ok: true,
        data: result,
        status: 200
      });
    } catch (error) {
      console.error('获取WHO最新新闻失败:', error);
      return res.status(500).json({ 
        ok: false,
        error: '获取WHO最新新闻数据时发生错误',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  })();
});

/**
 * 获取WHO指定页面范围的新闻
 * GET /who-news/range?start=1&end=5
 */
router.get("/who-news/range", (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const startPage = parseInt(req.query.start as string) || 1;
      const endPage = parseInt(req.query.end as string) || 3;

      if (startPage > endPage) {
        return res.status(400).json({
          ok: false,
          error: '起始页不能大于结束页'
        });
      }

      console.log(`获取WHO新闻第 ${startPage}-${endPage} 页`);
      
      const result = await fetchWHONewsRange(startPage, endPage);

      return res.json({
        ok: true,
        data: result,
        status: 200
      });
    } catch (error) {
      console.error('获取WHO新闻范围失败:', error);
      return res.status(500).json({ 
        ok: false,
        error: '获取WHO新闻范围数据时发生错误',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  })();
});

// 这里可以添加更多与新闻相关的接口
// 例如：获取单条新闻、添加新闻、更新新闻、删除新闻等

export default router;