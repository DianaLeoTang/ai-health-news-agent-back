import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { URL } from 'url';
import UserAgent from 'user-agents';
import { NEWS_SOURCES, CONFIGS, NEWS_OFFICE } from './config';
import {
  CacheData,
  RequestResult,
  Link,
  Article,
  CrawlerConfig,
  ExtendedRequestResult,
  TaskError
} from './types';

import { createMagazineUrlMap, getMagazineName } from './matchMagezine';

// In-memory cache with aggressive TTL
const memoryCache = new Map<string, CacheData<RequestResult>>();

// Background processing queue
type BackgroundTask = {
  url: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: ExtendedRequestResult;
};

const backgroundQueue: Map<string, BackgroundTask> = new Map();
let isBackgroundProcessingRunning = false;

/**
 * Gets a cached result or a placeholder if processing in background
 */
function getFromMemoryCache(url: string): ExtendedRequestResult | null {
  // Check memory cache first (fast path)
  if (memoryCache.has(url)) {
    const cachedData = memoryCache.get(url)!;
    if (Date.now() - cachedData.timestamp < CONFIGS.cacheTTL) {
      const { data, status, statusCode, timestamp, links, articles, title } = cachedData.data;
      return {
        url,
        data,
        status: status as 'success' | 'error' | 'pending',
        statusCode,
        timestamp,
        fromCache: 'memory',
        links: links || [],
        articles: articles || [],
        title
      };
    }
    memoryCache.delete(url);
  }
  return null;
}

/**
 * Process background tasks in parallel but limit concurrency
 */
async function processBackgroundQueue() {
  if (isBackgroundProcessingRunning) return;
  isBackgroundProcessingRunning = true;

  try {
    const pendingTasks = Array.from(backgroundQueue.values())
      .filter(task => task.status === 'pending')
      .sort((a, b) => a.timestamp - b.timestamp);
      
    if (pendingTasks.length === 0) {
      isBackgroundProcessingRunning = false;
      return;
    }

    // Process in chunks to control concurrency
    const chunkSize = CONFIGS.concurrentLimit;
    const tasks = pendingTasks.slice(0, chunkSize);
    
    // Mark tasks as processing
    for (const task of tasks) {
      task.status = 'processing';
    }
    
    // Process each task in parallel
    await Promise.all(tasks.map(async (task) => {
      try {
        const result = await fetchWithAxios(task.url);
        
        // Process content extraction in the background
        if (result.status === 'success' && result.data) {
          try {
            // Initialize magazine name mapping
            const { urlToMagazine, domainToMagazine } = createMagazineUrlMap(NEWS_OFFICE);
            
            // Extract content
            const extracted = extractContentWithCheerio(result.data, result.url);
            result.title = getMagazineName(result.url, urlToMagazine, domainToMagazine);
            result.links = extracted.links || [];
            result.articles = extracted.articles || [];
            
            // Remove HTML to save memory
            if (!CONFIGS.saveRawHtml) {
              delete result.data;
            }
            
            // Update cache for future requests
            memoryCache.set(task.url, {
              data: result,
              timestamp: Date.now()
            });
            
            // Save to persistent cache asynchronously (don't await)
            saveToCache(task.url, result).catch(err => {
              console.warn(`Background cache save failed for ${task.url}: ${err.message}`);
            });
          } catch (error) {
            console.error(`Background content extraction failed for ${task.url}:`, error);
            result.links = [];
            result.articles = [];
            result.title = 'Error extracting content';
          }
        }
        
        task.result = result;
        task.status = 'completed';
      } catch (error: any) {
        console.error(`Background task failed for ${task.url}:`, error);
        task.status = 'error';
        task.result = {
          url: task.url,
          status: 'error',
          statusCode: error.response?.status,
          timestamp: Date.now(),
          links: [],
          articles: [],
          title: 'Error'
        } as ExtendedRequestResult;
      }
    }));
    
    // Remove completed tasks after some time to avoid memory leaks
    setTimeout(() => {
      for (const [url, task] of backgroundQueue.entries()) {
        if (task.status === 'completed' || task.status === 'error') {
          if (Date.now() - task.timestamp > 60000) { // 1 minute
            backgroundQueue.delete(url);
          }
        }
      }
    }, 1000);
    
    // Continue processing if more tasks are pending
    setImmediate(processBackgroundQueue);
  } catch (error) {
    console.error('Background processing error:', error);
  } finally {
    isBackgroundProcessingRunning = false;
  }
}

/**
 * Ensures a directory exists
 */
async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Gets the cache file path for a URL
 */
function getCacheFilePath(url: string): string {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const pathname = urlObj.pathname.replace(/\//g, '_');
  const search = urlObj.search.replace(/[?&=]/g, '_');
  
  const filename = `${hostname}${pathname}${search}.json`;
  return path.join(CONFIGS.cacheDir, filename);
}

/**
 * Saves data to cache asynchronously
 */
async function saveToCache(url: string, data: RequestResult): Promise<void> {
  if (!CONFIGS.useCache) return;
  
  // Only select necessary fields
  const { data: htmlData, status, statusCode, timestamp, links, articles, title } = data;
  const cleanData: RequestResult = {
    url,
    data: htmlData,
    status,
    statusCode,
    timestamp: timestamp || Date.now(),
    links: links || [],
    articles: articles || [],
    title
  };
  
  // Create cache entry
  const cacheEntry: CacheData<RequestResult> = {
    data: cleanData,
    timestamp: cleanData.timestamp
  };
  
  // Save to memory cache
  memoryCache.set(url, cacheEntry);
  
  // Save to file cache
  try {
    await ensureDir(CONFIGS.cacheDir);
    const cacheFile = getCacheFilePath(url);
    await fs.writeFile(cacheFile, JSON.stringify(cleanData, null, 2));
  } catch (error) {
    console.warn(`Cache save failed (${url}): ${(error as Error).message}`);
  }
}

/**
 * Gets a random user agent
 */
function getRandomUserAgent(): string {
  try {
    return new UserAgent().toString();
  } catch (error) {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }
}

/**
 * Fetches a URL with axios (streamlined version)
 */
async function fetchWithAxios(url: string, options: Partial<{
  timeout: number;
  headers: Record<string, string>;
}> = {}): Promise<RequestResult> {
  const {
    timeout = CONFIGS.requestTimeout,
    headers = {}
  } = options;

  // Create axios request config
  const config: AxiosRequestConfig = {
    timeout,
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      ...headers
    },
    validateStatus: (status: number) => status >= 200 && status < 300,
    responseType: 'text'
  };

  try {
    const response = await axios.get(url, config);
    
    return {
      url,
      data: response.data,
      status: 'success',
      statusCode: response.status,
      timestamp: Date.now(),
      links: [],
      articles: []
    };
  } catch (error: any) {
    return {
      url,
      status: 'error',
      statusCode: error.response?.status,
      timestamp: Date.now(),
      links: [],
      articles: []
    };
  }
}

/**
 * Gets a selector for a specific website
 */
function getSelector(url: string, selectorType: string): string {
  const hostname = new URL(url).hostname;
  
  // Check for domain-specific selectors
  for (const domain in CONFIGS.selectors) {
    if (hostname.includes(domain) && 
        typeof CONFIGS.selectors[domain] === 'object' && 
        selectorType in CONFIGS.selectors[domain]) {
      return CONFIGS.selectors[domain][selectorType] as string;
    }
  }
  
  // Use generic selector
  if (selectorType in CONFIGS.selectors) {
    return CONFIGS.selectors[selectorType] as string;
  }
  
  return '';
}

/**
 * Extracts content from HTML
 */
function extractContentWithCheerio(html: string, url: string) {
  const $ = cheerio.load(html);
  const hostname = new URL(url).hostname;
  
  // Extract title
  const titleSelector = getSelector(url, 'title');
  const title = $(titleSelector).first().text().trim() || $('title').text().trim();
  
  // Extract links
  const linkSelector = getSelector(url, 'links');
  const links: Link[] = [];
  
  $(linkSelector).each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const title = $el.text().trim();
    
    if (href && title && !href.startsWith('#') && !href.startsWith('javascript:')) {
      try {
        const absoluteUrl = new URL(href, url).href;
        
        if (new URL(absoluteUrl).hostname === hostname) {
          links.push({
            url: absoluteUrl,
            title: title.replace(/\s+/g, ' ').substr(0, 100)
          });
        }
      } catch (error) {
        // Ignore invalid URLs
      }
    }
  });
  
  // Extract articles
  const articles: Article[] = [];
  const articleSelector = getSelector(url, 'articles');
  
  if (articleSelector) {
    $(articleSelector).each((i, el) => {
      const $article = $(el);
      
      // Extract article title
      const titleSel = getSelector(url, 'title').replace(/^.*?\s+/, '');
      const articleTitle = $article.find(titleSel).text().trim() || $article.find('h1, h2, h3, h4').first().text().trim();
      
      // Extract article link
      const linkEl = $article.find('a').first();
      let articleUrl = '';
      
      if (linkEl.length) {
        try {
          articleUrl = new URL(linkEl.attr('href') || '', url).href;
        } catch (error) {
          // Ignore invalid URLs
        }
      }
      
      // Extract article date
      const dateSel = getSelector(url, 'date');
      let date = '';
      
      if (dateSel) {
        date = $article.find(dateSel).text().trim();
      }
      
      // Extract article summary
      let summary = '';
      const possibleSummaryElements = $article.find('p, .summary, [itemprop="description"]');
      
      if (possibleSummaryElements.length) {
        summary = possibleSummaryElements.first().text().trim();
      }
      
      if (articleTitle) {
        articles.push({
          title: articleTitle,
          url: articleUrl,
          date,
          summary: summary.substr(0, 200)
        });
      }
    });
  }
  
  return {
    links,
    articles
  };
}

/**
 * Schedules a URL for background processing
 */
function scheduleBackgroundFetch(url: string): void {
  if (!backgroundQueue.has(url)) {
    backgroundQueue.set(url, {
      url,
      timestamp: Date.now(),
      status: 'pending'
    });
    
    // Start processing if not already running
    if (!isBackgroundProcessingRunning) {
      processBackgroundQueue();
    }
  }
}

/**
 * Main function: Gets news from all sources with near-instant response
 */
export async function getAllNews(
  urls: string[] = NEWS_SOURCES, 
  options: Partial<CrawlerConfig> = {}
): Promise<ExtendedRequestResult[]> {
  // Merge options with config
  const mergedOptions = { ...CONFIGS, ...options };
  
  // Results to return immediately
  const results: ExtendedRequestResult[] = [];
  
  // Process each URL
  for (const url of urls) {
    // Check if we have a valid cached result
    const cachedResult = getFromMemoryCache(url) as ExtendedRequestResult | null;
    
    if (cachedResult) {
      // Use cached result
      results.push(cachedResult);
    } else {
      // Check if URL is already being processed in background
      const backgroundTask = backgroundQueue.get(url);
      
      if (backgroundTask && (backgroundTask.status === 'completed' || backgroundTask.status === 'error') && backgroundTask.result) {
        // Use completed background task result
        results.push(backgroundTask.result);
      } else if (backgroundTask && backgroundTask.status === 'processing') {
                  // Return placeholder for in-progress task
        const pendingResult: ExtendedRequestResult = {
          url,
          status: 'pending',
          statusCode: 202,
          timestamp: Date.now(),
          links: [],
          articles: [],
          title: 'Loading...'
        };
        results.push(pendingResult);
      } else {
        // Schedule for background processing and return placeholder
        scheduleBackgroundFetch(url);
        
        const pendingResult: ExtendedRequestResult = {
          url,
          status: 'pending',
          statusCode: 202,
          timestamp: Date.now(),
          links: [],
          articles: [],
          title: 'Loading...'
        };
        results.push(pendingResult);
      }
    }
  }
  
  // Return fast placeholder results
  return results;
}

/**
 * Refreshes cache for URLs in the background
 */
export function refreshUrlsInBackground(urls: string[]): void {
  for (const url of urls) {
    scheduleBackgroundFetch(url);
  }
}

/**
 * Gets the current status of background processing
 */
export function getBackgroundProcessingStatus(): {
  pending: number;
  processing: number;
  completed: number;
  error: number;
  total: number;
} {
  const tasks = Array.from(backgroundQueue.values());
  
  return {
    pending: tasks.filter(t => t.status === 'pending').length,
    processing: tasks.filter(t => t.status === 'processing').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    error: tasks.filter(t => t.status === 'error').length,
    total: tasks.length
  };
}