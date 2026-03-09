/*
 * @Author: Diana Tang
 * @Date: 2025-03-06 16:24:10
 * @LastEditors: Diana Tang
 * @Description: Optimized news crawler using Puppeteer
 * @FilePath: /AI-Health-News-Agent-Back/src/services/fetchNewsWithPuppeteer.ts
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { NEWS_SOURCES } from './config';

interface NewsArticle {
  title: string;
  link: string;
  summary: string;
  source?: string;
}

// Reuse browser instance
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({ 
      headless: true,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--disable-extensions',
        '--disable-accelerated-2d-canvas',
      ]
    });
  }
  return browserInstance;
}

// Close browser instance
export async function closeBrowser(): Promise<void> {
  if (browserInstance && browserInstance.isConnected()) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function fetchNewsWithPuppeteer(url: string, timeout = 30000): Promise<NewsArticle[]> {
  let page: Page | null = null;
  
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Performance optimization settings
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      // Block unnecessary resources
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36');
    
    // Set timeout
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout 
    });

    // JAMA 的 Just Published 多为 JS 渲染，多等一会再取
    if (url.includes('jamanetwork.com')) {
      await new Promise((r) => setTimeout(r, 3000));
    }

    // Use more specific selectors to reduce DOM query scope
    const isJama = url.includes('jamanetwork.com');
    const articles = await page.evaluate((args: { siteUrl: string; isJama: boolean }) => {
      const { siteUrl, isJama } = args;
      const news: Array<{ title: string; link: string; summary: string }> = [];
      const seenHref = new Set<string>();

      function addItem(title: string, link: string, summary: string) {
        if (!title || !link || seenHref.has(link)) return;
        try {
          const full = link.startsWith('http') ? link : new URL(link, siteUrl).href;
          if (!full.includes('jamanetwork.com')) return;
          seenHref.add(full);
          news.push({ title: title.trim(), link: full, summary: summary || '' });
        } catch (_) {}
      }

      if (isJama) {
        // 1) 当前 Just Published 使用 a.article--title，优先用这个
        const titleLinks = document.querySelectorAll('a.article--title');
        titleLinks.forEach((a) => {
          const anchor = a as HTMLAnchorElement;
          const href = anchor.href;
          const text = anchor.textContent?.trim();
          if (href && text) addItem(text, href, '');
        });

        // 2) 再试 .card-article（旧版/部分子页）
        if (news.length === 0) {
          const cardArticles = document.querySelectorAll('.card-article');
          cardArticles.forEach((el) => {
            const titleEl = el.querySelector('h3, h2, h4, a');
            const linkEl = el.querySelector('a[href]') as HTMLAnchorElement | null;
            const summaryEl = el.querySelector('p, .meta-date, .summary');
            const title = titleEl?.textContent?.trim();
            const link = linkEl?.href;
            if (title && link) addItem(title, link, summaryEl?.textContent?.trim() || '');
          });
        }

        // 3) 再试常见容器：带 article / item / listing 的块
        if (news.length === 0) {
          const containers = document.querySelectorAll('[class*="article"], [class*="card"], [class*="item"], [class*="listing"]');
          containers.forEach((el) => {
            const linkEl = el.querySelector('a[href*="article-abstract"], a[href*="/article/"], a[href*="/fullarticle"]') as HTMLAnchorElement | null;
            if (!linkEl?.href) return;
            const title = (el.querySelector('h3, h2, h4, .title, [class*="title"]') || linkEl)?.textContent?.trim();
            const summaryEl = el.querySelector('p, [class*="meta"], [class*="summary"]');
            addItem(title || linkEl.textContent?.trim() || 'Untitled', linkEl.href, summaryEl?.textContent?.trim() || '');
          });
        }

        // 3) 最后回退：页面上所有“文章详情”链接（Just Published 里每篇都是链接）
        if (news.length === 0) {
          const articleLinks = document.querySelectorAll('a[href*="/article-abstract"], a[href*="/journals/jama/article"], a[href*="/fullarticle"]');
          articleLinks.forEach((a) => {
            const anchor = a as HTMLAnchorElement;
            const href = anchor.href;
            if (!href || !href.includes('jamanetwork.com')) return;
            const text = anchor.textContent?.trim();
            if (!text || text.length < 5) return; // 过滤过短（如 "PDF"）
            addItem(text, href, '');
          });
        }
      } else {
        const selector = 'article, .article, .news-item, .post, [class*="article"], [class*="news"]';
        const articleElements = document.querySelectorAll(selector);
        articleElements.forEach((el) => {
          const titleElement = el.querySelector('h2, h3, h4, .title, .headline') as HTMLElement | null;
          const linkElement = el.querySelector('a[href]') as HTMLAnchorElement | null;
          const summaryElement = el.querySelector('p, .summary, .excerpt, .description') as HTMLElement | null;
          let title = titleElement?.innerText?.trim();
          let link = linkElement?.href;
          let summary = summaryElement?.innerText?.trim();
          if (link && !link.startsWith('http')) link = new URL(link, siteUrl).href;
          if (title && link) news.push({ title, link, summary: summary || 'No summary available' });
        });
      }
      
      return news;
    }, { siteUrl: url, isJama });

    return articles;
  } catch (error) {
    console.error(`❌ Error fetching news from ${url}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  } finally {
    // Ensure page is closed to release resources
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore errors when closing the page
      }
    }
  }
}

export async function getAllNews(): Promise<NewsArticle[]> {
  try {
    // Parallel fetch from all news sources
    const promises = NEWS_SOURCES.map(async (source) => {
      try {
        const news = await fetchNewsWithPuppeteer(source);
        // Add source information
        return news.map(item => ({...item, source}));
      } catch (error) {
        console.error(`Failed to fetch from ${source}: ${error instanceof Error ? error.message : String(error)}`);
        return [];
      }
    });
    
    // Wait for all requests to complete
    const results = await Promise.all(promises);
    
    // Merge results
    return results.flat();
  } catch (error) {
    console.error(`Error in getAllNews: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
  // Note: Browser is intentionally kept alive for long-running services
  // Call closeBrowser() explicitly when needed
}

// Helper function with timeout control
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutHandle);
  });
}