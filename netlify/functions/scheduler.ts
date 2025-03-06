import { Handler } from '@netlify/functions';
import { getAllNews } from '../../src/services/fetchNewsWithPuppeteer';

// 标准 Netlify Functions 格式
export const handler: Handler = async (event, context) => {
  // 检查是否是定时触发
  if (event.body === '{"scheduled":true}') {
    try {
      console.log('开始自动抓取新闻');
      const news = await getAllNews();
      console.log(`成功抓取 ${news.length} 条新闻`);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      console.error('自动抓取新闻失败:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch news' })
      };
    }
  }
  
  // 如果不是定时触发，可能是手动调用
  return {
    statusCode: 200,
    body: JSON.stringify({ message: '这个函数主要用于定时任务，但也可以手动调用' })
  };
};