/*
 * @Author: Diana Tang
 * @Date: 2025-03-05
 * @LastEditors: Diana Tang
 * @Description: 首页相关路由
 * @FilePath: /AI-Health-News-Agent-Back/src/routes/home-routes.ts
 */
import { Router } from 'express';

const router = Router();

// 首页路由
router.get("/", (req, res) => {
  // 检测当前环境，Netlify Functions环境下req.headers.host会是Netlify的域名
  const isNetlifyEnv = process.env.NETLIFY || req.headers.host?.includes('netlify');
  
  // 根据环境生成正确的新闻链接路径
  const newsPath = isNetlifyEnv 
    ? "/.netlify/functions/api/news"  // Netlify Functions环境
    : "/news";                        // 本地开发环境
  
  res.send(
    `<h1>Welcome to AI-Health-News-Agent</h1><p>Use <a href="${newsPath}">/news</a> to get the latest public health news.</p>`
  );
});

export default router;