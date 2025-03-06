/*
 * @Author: Diana Tang
 * @Date: 2025-03-05
 * @LastEditors: Diana Tang
 * @Description: 首页相关路由
 * @FilePath: /AI-Health-News-Agent/apps/back-end/src/routes/home-routes.ts
 */
import { Router } from 'express';

const router = Router();

// 首页路由
router.get("/", (req, res) => {
  res.send(
    '<h1>Welcome to AI-Health-News-Agent</h1><p>Use <a href="/news">/news</a> to get the latest public health news.</p>'
  );
});

export default router;