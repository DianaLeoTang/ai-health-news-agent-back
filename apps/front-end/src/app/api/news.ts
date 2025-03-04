// pages/api/news.ts (Pages Router)
import type { NextApiRequest, NextApiResponse } from 'next';

// 安全的fetch函数，防止异常导致500错误
async function safeFetch(url: string) {
  try {
    const controller = new AbortController();
    // 设置5秒超时
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`安全fetch失败: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 只允许GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允许' });
  }

  try {
    console.log('API路由: 尝试获取新闻数据');
    
    // 尝试从后端获取数据
    const data = await safeFetch('http://localhost:3000/news');
    
    // 如果获取成功，返回数据
    if (data) {
      console.log('API路由: 成功获取数据');
      return res.status(200).json(data);
    }
    
    // 如果获取失败，返回后备数据
    console.log('API路由: 使用后备数据');
    return res.status(200).json([
      {
        "title": "WHO looks back at 2024",
        "link": "https://www.who.int/news-room/spotlight/who-looks-back-at-2024",
        "summary": "No summary available"
      },
      {
        "title": "How academia's 'lone wolf' culture is harming researcher mental health",
        "link": "https://www.nature.com/articles/d41586-025-00603-4",
        "summary": "Nature Careers Podcast | 28 February 2025"
      },
      {
        "title": "Automated loss of pulse detection on a consumer smartwatch",
        "link": "https://www.nature.com/articles/s41586-025-08810-9",
        "summary": "Article | 26 February 2025"
      }
    ]);
  } catch (error) {
    console.error('API路由发生错误:', error);
    
    // 确保即使发生错误也能返回后备数据
    return res.status(200).json([
      {
        "title": "WHO looks back at 2024",
        "link": "https://www.who.int/news-room/spotlight/who-looks-back-at-2024",
        "summary": "No summary available"
      },
      {
        "title": "How academia's 'lone wolf' culture is harming researcher mental health",
        "link": "https://www.nature.com/articles/d41586-025-00603-4",
        "summary": "Nature Careers Podcast | 28 February 2025"
      },
      {
        "title": "Automated loss of pulse detection on a consumer smartwatch",
        "link": "https://www.nature.com/articles/s41586-025-08810-9",
        "summary": "Article | 26 February 2025"
      }
    ]);
  }
}
