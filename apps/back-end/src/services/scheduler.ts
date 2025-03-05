/*
 * @Author: Diana Tang
 * @Date: 2025-03-05
 * @LastEditors: Diana Tang
 * @Description: 定时任务服务
 * @FilePath: /AI-Health-News-Agent/apps/back-end/src/services/scheduler.ts
 */
import cron from 'node-cron';
import { getAllNews } from '../fetchNewsWithPuppeteer';
import { generateReport } from '../generateReport';
import { sendEmail } from '../sendEmail';

// 定时任务调度器
class Scheduler {
  private scheduledTasks: cron.ScheduledTask[] = [];

  // 初始化所有定时任务
  initialize() {
    this.scheduleNewsReportTask();
    // 可以在这里添加其他定时任务
  }

  // 设置新闻报告定时任务
  private scheduleNewsReportTask() {
    const task = cron.schedule("0 8 * * *", async () => {
      console.log("Running scheduled news update...");
      try {
        let newsData = await getAllNews();
        await generateReport(newsData);
        await sendEmail();
        console.log("Daily news report generated and sent successfully.");
      } catch (error) {
        console.error("Error in daily news report task:", error);
      }
    });
    
    this.scheduledTasks.push(task);
  }

  // 停止所有定时任务
  stopAll() {
    this.scheduledTasks.forEach(task => task.stop());
    console.log("All scheduled tasks stopped.");
  }
}

// 创建并导出调度器实例
export const scheduler = new Scheduler();