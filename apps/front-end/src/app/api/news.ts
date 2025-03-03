/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 22:30:44
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/apps/front-end/src/app/api/news.ts
 */
// pages/api/news.ts (Pages Router)
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('API路由: 开始从后端获取新闻数据');
    
    // 尝试从实际后端获取数据
    const response = await fetch('http://localhost:3000/news', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`API路由: 后端响应错误 ${response.status}`);
      // 如果后端请求失败，返回模拟数据
      return res.status(200).json(getFallbackData());
    }
    
    const data = await response.json();
    console.log('API路由: 成功获取数据');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('API路由: 请求处理错误', error);
    
    // 出错时返回模拟数据
    return res.status(200).json(getFallbackData());
  }
}

// // 模拟数据
// function getFallbackData() {
//   return [
//     {
//       "title": "WHO looks back at 2024",
//       "link": "https://www.who.int/news-room/spotlight/who-looks-back-at-2024",
//       "summary": "No summary available"
//     },
//     {
//       "title": "How academia's 'lone wolf' culture is harming researcher mental health",
//       "link": "https://www.nature.com/articles/d41586-025-00603-4",
//       "summary": "Nature Careers Podcast | 28 February 2025"
//     },
//     {
//       "title": "Automated loss of pulse detection on a consumer smartwatch",
//       "link": "https://www.nature.com/articles/s41586-025-08810-9",
//       "summary": "Article | 26 February 2025"
//     }
//   ];
// }