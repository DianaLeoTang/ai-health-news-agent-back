/*
 * @Author: Diana Tang
 * @Date: 2026-01-01
 * @Description: WHO网站专用爬虫，支持分页抓取
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

interface WHOArticle {
  title: string;
  url: string;
  date: string;
  summary: string;
  type?: string; // News release, Statement, etc.
}

interface WHOCrawlerResult {
  url: string;
  title: string;
  articles: WHOArticle[];
  totalPages: number;
  crawledPages: number;
  timestamp: number;
}

/**
 * 抓取WHO单个页面的新闻
 * @param url - WHO页面URL
 * @returns 新闻文章数组
 */
async function fetchWHOPage(url: string): Promise<WHOArticle[]> {
  try {
    console.log(`正在抓取: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    const articles: WHOArticle[] = [];

    // WHO Headlines页面的文章选择器
    // 每个新闻项都在一个链接中
    $('a[href*="/news/item/"]').each((index, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const title = $link.text().trim();

      if (href && title && title.length > 10) {
        // 构建完整URL
        const fullUrl = href.startsWith('http') ? href : `https://www.who.int${href}`;
        
        // 尝试从URL中提取日期和类型
        const urlMatch = href.match(/\/(\d{2})-(\d{2})-(\d{4})-(.+)$/);
        let date = '';
        let type = '';
        
        if (urlMatch) {
          const [, day, month, year] = urlMatch;
          date = `${day} ${getMonthName(parseInt(month))} ${year}`;
        }

        // 检查是否已经添加过这个URL（避免重复）
        if (!articles.find(a => a.url === fullUrl)) {
          articles.push({
            title: title,
            url: fullUrl,
            date: date,
            summary: title, // 在headlines页面，summary就是title
            type: type
          });
        }
      }
    });

    // 如果上面的方法没有找到文章，尝试另一种选择器
    if (articles.length === 0) {
      $('.list-view--item, .news-item, article').each((index, element) => {
        const $article = $(element);
        const $link = $article.find('a').first();
        const title = $article.find('.heading, h2, h3, h4').first().text().trim() 
                      || $link.text().trim();
        const href = $link.attr('href');
        const date = $article.find('.date, time, .meta-date').first().text().trim();
        const summary = $article.find('p, .summary, .excerpt').first().text().trim();

        if (href && title) {
          const fullUrl = href.startsWith('http') ? href : `https://www.who.int${href}`;
          
          if (!articles.find(a => a.url === fullUrl)) {
            articles.push({
              title: title,
              url: fullUrl,
              date: date,
              summary: summary || title,
            });
          }
        }
      });
    }

    console.log(`✓ 在 ${url} 找到 ${articles.length} 条新闻`);
    return articles;
  } catch (error) {
    console.error(`✗ 抓取失败 ${url}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * 获取WHO Headlines的总页数
 * @param baseUrl - WHO Headlines基础URL
 * @returns 总页数
 */
async function getTotalPages(baseUrl: string): Promise<number> {
  try {
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    let maxPage = 1;

    // 查找分页链接
    $('a[href*="/news-room/headlines/"]').each((index, element) => {
      const href = $(element).attr('href');
      const pageMatch = href?.match(/\/headlines\/(\d+)$/);
      
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1]);
        if (pageNum > maxPage) {
          maxPage = pageNum;
        }
      }
    });

    // 也检查分页导航中的数字链接
    $('.pagination a, .pager a, nav a').each((index, element) => {
      const text = $(element).text().trim();
      const pageNum = parseInt(text);
      
      if (!isNaN(pageNum) && pageNum > maxPage) {
        maxPage = pageNum;
      }
    });

    console.log(`检测到总页数: ${maxPage}`);
    return maxPage;
  } catch (error) {
    console.error('检测总页数失败:', error);
    return 1; // 默认返回1页
  }
}

/**
 * 抓取WHO Headlines的所有分页新闻
 * @param options - 配置选项
 * @returns 抓取结果
 */
export async function fetchAllWHONews(options: {
  maxPages?: number; // 最多抓取多少页，默认全部
  startPage?: number; // 从第几页开始，默认1
  delayMs?: number; // 每页之间的延迟（毫秒），默认1000
} = {}): Promise<WHOCrawlerResult> {
  const { 
    maxPages = Infinity, 
    startPage = 1,
    delayMs = 1000 
  } = options;

  const baseUrl = 'https://www.who.int/news-room/headlines';
  const allArticles: WHOArticle[] = [];
  
  console.log('开始抓取WHO Headlines...');
  
  // 获取总页数
  const totalPages = await getTotalPages(baseUrl);
  const pagesToCrawl = Math.min(maxPages, totalPages);
  
  console.log(`将抓取 ${pagesToCrawl} 页（共 ${totalPages} 页）`);

  // 抓取每一页
  for (let page = startPage; page <= pagesToCrawl; page++) {
    const pageUrl = page === 1 ? baseUrl : `${baseUrl}/${page}`;
    const articles = await fetchWHOPage(pageUrl);
    
    allArticles.push(...articles);
    
    // 如果不是最后一页，等待一下再抓取下一页
    if (page < pagesToCrawl) {
      console.log(`等待 ${delayMs}ms 后抓取下一页...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // 去重（基于URL）
  const uniqueArticles = Array.from(
    new Map(allArticles.map(article => [article.url, article])).values()
  );

  console.log(`✓ 抓取完成！共获取 ${uniqueArticles.length} 条独特的新闻`);

  return {
    url: baseUrl,
    title: 'WHO Headlines',
    articles: uniqueArticles,
    totalPages: totalPages,
    crawledPages: pagesToCrawl,
    timestamp: Date.now()
  };
}

/**
 * 抓取WHO指定页面范围的新闻
 * @param startPage - 起始页
 * @param endPage - 结束页
 * @returns 抓取结果
 */
export async function fetchWHONewsRange(
  startPage: number, 
  endPage: number
): Promise<WHOCrawlerResult> {
  return fetchAllWHONews({
    startPage,
    maxPages: endPage - startPage + 1,
    delayMs: 1000
  });
}

/**
 * 获取月份名称
 */
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}

/**
 * 快速抓取WHO最新的N条新闻（只抓前几页）
 * @param count - 需要的新闻数量
 * @returns 抓取结果
 */
export async function fetchLatestWHONews(count: number = 50): Promise<WHOCrawlerResult> {
  // 假设每页10条新闻
  const pagesToFetch = Math.ceil(count / 10);
  
  return fetchAllWHONews({
    maxPages: pagesToFetch,
    delayMs: 500 // 抓取最新新闻时可以快一点
  });
}

