/*
 * @Author: Diana Tang
 * @Date: 2025-03-05
 * @LastEditors: Diana Tang
 * @Description: 存档相关路由
 * @FilePath: /AI-Health-News-Agent-Back/src/routes/archive-routes.ts
 */
import { Router } from 'express';
import * as path from 'path';
// 这些导入被注释掉，与原main.ts保持一致，待实际使用时取消注释
// import NewsArchiver from '../NewsArchiver';
// import ArchiveController from '../ArchiveController';

const router = Router();

// 以下代码被注释掉，与原main.ts保持一致，待实际使用时取消注释
/*
// 初始化新闻存档服务
const newsArchiver = new NewsArchiver({
  apiUrl: 'http://localhost:4000/news', // 此处使用自己的API路径
  archiveDir: path.join(process.cwd(), 'news-archives'),
  scheduleCron: '0 0 * * *' // 每天午夜执行
});

// 启动定时任务
newsArchiver.startScheduler();

// 初始化控制器
const archiveController = new ArchiveController(newsArchiver);

// 存档相关API
router.post('/archives/trigger', archiveController.manualArchive);
router.get('/archives', archiveController.getArchives);
router.get('/archives/:filename', archiveController.getArchiveContent);

// 提供静态文件访问
router.use('/static/archives', express.static(newsArchiver.getArchiveDir()));

// 导出存档服务供main.ts使用，以便在应用关闭时停止调度器
export const archiveService = newsArchiver;
*/

export default router;