/*
 * @Author: Diana Tang
 * @Date: 2025-03-06 15:55:52
 * @LastEditors: Diana Tang
 * @Description: 服务器启动文件
 * @FilePath: /AI-Health-News-Agent-Back/src/server.ts
 */
import app from './app';

// 导入配置
import { SERVER } from './services/config';

// 导入服务
import { scheduler } from './services/scheduler';

// 启动服务器
app.listen(SERVER.PORT, () => {
  console.log(`Server running on http://localhost:${SERVER.PORT}`);
});

// 初始化定时任务
scheduler.initialize();

// 处理应用程序关闭
process.on('SIGINT', () => {
  console.log('关闭服务器...');
  scheduler.stopAll();
  // 如果存档服务实现，则取消注释以下代码
  // import { archiveService } from './routes/archive-routes';
  // archiveService.stopScheduler();
  process.exit();
});