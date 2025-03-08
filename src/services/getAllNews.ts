import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { URL } from 'url';
// 修正导入方式
import UserAgent from 'user-agents';
import { NEWS_SOURCES, CONFIGS, SERVER ,NEWS_OFFICE} from './config';
import { 
  CacheData,
  RequestResult, 
  ExtractedContent,
  Link,
  Article,
  CrawlerConfig
} from './types';
import {createMagazineUrlMap,getMagazineName} from './matchMagezine'
// 缓存存储
const memoryCache = new Map<string, CacheData<RequestResult>>();

/**
 * 确保目录存在
 * @param dir - 目录路径
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
 * 获取文件缓存路径
 * @param url - 请求URL
 * @returns 缓存文件路径
 */
function getCacheFilePath(url: string): string {
  // 将URL转换为安全的文件名
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const pathname = urlObj.pathname.replace(/\//g, '_');
  const search = urlObj.search.replace(/[?&=]/g, '_');
  
  const filename = `${hostname}${pathname}${search}.json`;
  return path.join(CONFIGS.cacheDir, filename);
}

/**
 * 从缓存中获取数据
 * @param url - 请求URL
 * @returns 缓存数据或null
 */
async function getFromCache(url: string): Promise<RequestResult | null> {
  if (!CONFIGS.useCache) return null;
  
  // 先检查内存缓存
  if (memoryCache.has(url)) {
    const cachedData = memoryCache.get(url)!;
    if (Date.now() - cachedData.timestamp < CONFIGS.cacheTTL) {
      // 确保只返回需要的字段
      const { data, status, statusCode, timestamp, links, articles } = cachedData.data;
      const result: RequestResult = { 
        url, 
        data, 
        status, 
        statusCode, 
        timestamp,
        fromCache: 'memory',
        links: links || [],
        articles: articles || []
      };
      return result;
    } else {
      memoryCache.delete(url);
    }
  }
  
  // 再检查文件缓存
  try {
    const cacheFile = getCacheFilePath(url);
    const rawData = JSON.parse(await fs.readFile(cacheFile, 'utf8')) as RequestResult;
    
    if (Date.now() - rawData.timestamp < CONFIGS.cacheTTL) {
      // 提取我们需要的字段，确保不包含headers
      const { data, status, statusCode, timestamp, links, articles } = rawData;
      
      // 创建符合RequestResult类型的对象
      const cleanData: RequestResult = { 
        url, 
        data, 
        status, 
        statusCode, 
        timestamp,
        fromCache: 'file',
        links: links || [],
        articles: articles || []
      };
      
      // 同时更新内存缓存 - 避免使用类型断言
      const cacheEntry: CacheData<RequestResult> = {
        data: cleanData,
        timestamp: rawData.timestamp
      };
      memoryCache.set(url, cacheEntry);
      
      return cleanData;
    }
  } catch (error) {
    // 缓存不存在或已过期，忽略错误
  }
  
  return null;
}

/**
 * 将数据保存到缓存
 * @param url - 请求URL
 * @param data - 要缓存的数据
 */
async function saveToCache(url: string, data: RequestResult): Promise<void> {
  if (!CONFIGS.useCache) return;
  
  // 只选择需要的字段保存到缓存
  const { data: htmlData, status, statusCode, timestamp, links, articles } = data;
  // 创建一个符合RequestResult类型的对象
  const cleanData: RequestResult = {
    url,
    data: htmlData,
    status,
    statusCode,
    timestamp: timestamp || Date.now(),
    // 不设置fromCache属性，因为这是原始数据
    links: links || [],
    articles: articles || []
  };
  
  // 创建缓存条目 - 明确类型
  const cacheEntry: CacheData<RequestResult> = {
    data: cleanData,
    timestamp: cleanData.timestamp
  };
  
  // 保存到文件缓存
  try {
    await ensureDir(CONFIGS.cacheDir);
    const cacheFile = getCacheFilePath(url);
    await fs.writeFile(cacheFile, JSON.stringify(cleanData, null, 2));
  } catch (error) {
    console.warn(`保存缓存失败 (${url}): ${(error as Error).message}`);
  }
}

/**
 * 生成随机用户代理
 * @returns 随机用户代理字符串
 */
function getRandomUserAgent(): string {
  try {
    return new UserAgent().toString();
  } catch (error) {
    // 如果user-agents库不可用，返回默认值
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }
}

/**
 * 使用axios请求单个URL，带超时和重试机制
 * @param url - 要请求的URL
 * @param options - 配置选项
 * @returns 请求结果
 */
async function fetchWithAxios(url: string, options: Partial<{
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
  useProxy: boolean;
  proxyUrl: string;
}> = {}): Promise<RequestResult> {
  const {
    timeout = CONFIGS.requestTimeout,
    retries = CONFIGS.retries,
    retryDelay = CONFIGS.retryDelay,
    headers = {},
    useProxy = CONFIGS.useProxy,
    proxyUrl = CONFIGS.proxyUrl
  } = options;

      // 检查缓存
  const cachedData = await getFromCache(url);
  if (cachedData) {
    // 确保缓存数据符合我们期望的结构
    const { url, data, status, statusCode, timestamp, fromCache, links, articles } = cachedData;
    return { 
      url, 
      data, 
      status, 
      statusCode, 
      timestamp, 
      fromCache, 
      links: links || [], 
      articles: articles || [] 
    };
  }

  // 创建axios请求配置
  const config: AxiosRequestConfig = {
    timeout,
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Upgrade-Insecure-Requests': '1',
      ...headers
    },
    validateStatus: (status: number) => status >= 200 && status < 300,
    responseType: 'text'
  };
  

  // 重试逻辑
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        // 在重试前等待，并增加延迟时间
        const sleepTime = retryDelay * Math.pow(1.5, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, sleepTime));
        console.log(`重试 ${url} (${attempt}/${retries})`);
      }
      
      const response: AxiosResponse<string> = await axios.get(url, config);
      
      const result: RequestResult = {
        url,
        data: response.data,
        status: 'success',
        statusCode: response.status,
        timestamp: Date.now(),
        links: [],
        articles: []
      };
      
      // 将结果存入缓存
      await saveToCache(url, result);
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // 特定错误类型的处理
      if (error.code === 'ECONNABORTED') {
        console.warn(`请求超时 ${url} (${attempt + 1}/${retries + 1})`);
      } else if (error.response) {
        // 服务器响应了，但状态码不在2xx范围
        console.warn(`HTTP错误 ${url}: ${error.response.status} (${attempt + 1}/${retries + 1})`);
        // 对于某些HTTP状态码不进行重试
        if ([403, 404, 410].includes(error.response.status)) {
          break;
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.warn(`无响应 ${url} (${attempt + 1}/${retries + 1})`);
      } else {
        // 请求设置时发生了错误
        console.warn(`请求错误 ${url}: ${error.message} (${attempt + 1}/${retries + 1})`);
      }
    }
  }

  // 所有重试都失败后返回错误结果 - 按照新格式，不包含error字段
  const errorResult: RequestResult = {
    url,
    status: 'error',
    statusCode: lastError.response?.status,
    timestamp: Date.now(),
    fromCache: null,
    links: [],    // 请求失败时提供空数组
    articles: []  // 请求失败时提供空数组
  };
  
  // 缓存错误结果（缓存时间较短）
  await saveToCache(url, {
    ...errorResult,
    timestamp: Date.now()
  });
  
  return errorResult;
}

/**
 * 格式化时间（秒）为可读的形式
 * @param seconds - 秒数
 * @returns 格式化的时间字符串
 */
function formatTime(seconds: number): string {
  seconds = Math.round(seconds);
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${mins}分`;
  }
}

/**
 * 批量并发请求，带并发控制
 * @param urls - URL数组
 * @param options - 配置选项
 * @returns 所有请求结果的Promise
 */
function batchFetchWithConcurrency(urls: string[], options: Partial<{
  concurrentLimit: number;
  progressInterval: number;
}> & Partial<Parameters<typeof fetchWithAxios>[1]> = {}): Promise<RequestResult[]> {
  const {
    concurrentLimit = CONFIGS.concurrentLimit,
    progressInterval = 2000,
    ...fetchOptions
  } = options;

  // 克隆URL数组，不修改原数组
  const urlsToProcess = [...urls];
  const results: RequestResult[] = [];
  let activePromises = 0;
  
  // 进度跟踪
  const total = urls.length;
  let completed = 0;
  let startTime = Date.now();
  
  const progressIntervalId = setInterval(() => {
    if (completed === total) {
      clearInterval(progressIntervalId);
      return;
    }
    
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    const rate = completed / elapsedSeconds;
    const remaining = total - completed;
    const estimatedSecondsLeft = rate > 0 ? remaining / rate : 0;
    
    console.log(
      `进度: ${completed}/${total} (${Math.round(completed/total*100)}%) - ` +
      `速率: ${rate.toFixed(2)}个/秒 - ` +
      `预计剩余时间: ${formatTime(estimatedSecondsLeft)}`
    );
  }, progressInterval);
  
  // 创建一个Promise，在所有请求完成时解析
  return new Promise<RequestResult[]>((resolve) => {
    // 启动尽可能多的初始请求（不超过并发限制）
    function startFetching() {
      // 当队列中还有URL且未达到并发限制时继续
      while (urlsToProcess.length > 0 && activePromises < concurrentLimit) {
        const url = urlsToProcess.shift()!;
        activePromises++;
        
        // 发起请求
        fetchWithAxios(url, fetchOptions)
          .then(result => {
            results.push(result);
            completed++;
            activePromises--;
            
            // 当一个请求完成后，尝试启动更多请求
            startFetching();
            
            // 如果所有请求都已完成，解析最终Promise
            if (activePromises === 0 && urlsToProcess.length === 0) {
              clearInterval(progressIntervalId);
              resolve(results);
            }
          })
          .catch(error => {
            console.error(`未捕获的错误 (${url}):`, error);
            // 处理未捕获的错误 - 使用新格式，不包含error和errorCode字段
            results.push({
              url,
              status: 'error',
              statusCode: error.response?.status,
              timestamp: Date.now(),
              links: [],     // 确保错误情况下有空数组
              articles: []   // 确保错误情况下有空数组
            });
            
            completed++;
            activePromises--;
            startFetching();
            
            if (activePromises === 0 && urlsToProcess.length === 0) {
              clearInterval(progressIntervalId);
              resolve(results);
            }
          });
      }
    }
    
    // 启动初始批次的请求
    startFetching();
    
    // 如果URL数组为空，立即解析
    if (urls.length === 0) {
      clearInterval(progressIntervalId);
      resolve([]);
    }
  });
}

/**
 * 获取网站特定的选择器
 * @param url - 页面URL
 * @param selectorType - 选择器类型
 * @returns 选择器
 */
function getSelector(url: string, selectorType: string): string {
  const hostname = new URL(url).hostname;
  
  // 检查是否有针对特定域名的选择器
  for (const domain in CONFIGS.selectors) {
    if (hostname.includes(domain) && 
        typeof CONFIGS.selectors[domain] === 'object' && 
        selectorType in CONFIGS.selectors[domain]) {
      return CONFIGS.selectors[domain][selectorType] as string;
    }
  }
  
  // 如果没有特定域名的选择器，返回通用选择器
  if (selectorType in CONFIGS.selectors) {
    return CONFIGS.selectors[selectorType] as string;
  }
  
  return '';
}

/**
 * 使用Cheerio从HTML中提取内容
 * @param html - HTML内容
 * @param url - 页面URL
 * @returns 提取的内容
 */
function extractContentWithCheerio(html: string, url: string): ExtractedContent {
  const $ = cheerio.load(html);
  const baseUrl = new URL(url).origin;
  const hostname = new URL(url).hostname;
  
  // 提取标题
  const titleSelector = getSelector(url, 'title');
  const title = $(titleSelector).first().text().trim() || $('title').text().trim();
  
  // 提取描述
  const descSelector = getSelector(url, 'description');
  let description = '';
  
  if (descSelector.includes('meta')) {
    description = $(descSelector).attr('content') || '';
  } else {
    description = $(descSelector).first().text().trim();
  }
  
  // 提取链接
  const linkSelector = getSelector(url, 'links');
  const links: Link[] = [];
  
  $(linkSelector).each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const title = $el.text().trim();
    
    if (href && title && !href.startsWith('#') && !href.startsWith('javascript:')) {
      try {
        // 处理相对URL
        const absoluteUrl = new URL(href, url).href;
        
        // 只保留来自同一域名的链接
        if (new URL(absoluteUrl).hostname === hostname) {
          links.push({
            url: absoluteUrl,
            title: title.replace(/\s+/g, ' ').substr(0, 100) // 规范化空白并限制长度
          });
        }
      } catch (error) {
        // 忽略无效的URL
      }
    }
  });
  
  // 提取文章（针对新闻网站）
  const articles: Article[] = [];
  const articleSelector = getSelector(url, 'articles');
  
  if (articleSelector) {
    $(articleSelector).each((i, el) => {
      const $article = $(el);
      
      // 提取文章标题
      const titleSel = getSelector(url, 'title').replace(/^.*?\s+/, ''); // 从完整选择器中移除前缀
      const articleTitle = $article.find(titleSel).text().trim() || $article.find('h1, h2, h3, h4').first().text().trim();
      
      // 提取文章链接
      const linkEl = $article.find('a').first();
      let articleUrl = '';
      
      if (linkEl.length) {
        try {
          articleUrl = new URL(linkEl.attr('href') || '', url).href;
        } catch (error) {
          // 忽略无效的URL
        }
      }
      
      // 提取文章日期
      const dateSel = getSelector(url, 'date');
      let date = '';
      
      if (dateSel) {
        date = $article.find(dateSel).text().trim();
      }
      
      // 提取文章简介
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
          summary: summary.substr(0, 200) // 限制长度
        });
      }
    });
  }
  
  // 提取元数据（包括Open Graph标签）
  const metadata: Record<string, string> = {};
  
  // 常规元数据
  $('meta').each((i, el) => {
    const name = $(el).attr('name') || $(el).attr('property');
    const content = $(el).attr('content');
    
    if (name && content) {
      metadata[name] = content;
    }
  });
  
  return {
    url,
    title,
    description,
    links, // 直接返回链接数组
    articles, // 直接返回文章数组
    metadata,
    hostname,
    extracted_at: new Date().toISOString()
  };
}

/**
 * 保存抓取结果到文件
 * @param results - 抓取结果
 */
async function saveResults(results: RequestResult[]): Promise<void> {
  try {
    await ensureDir(CONFIGS.outputDir);
    
    // 保存汇总数据
    const summary = results.map(result => ({
      url: result.url,
      status: result.status,
      title: result.extracted?.title || null,
      articles_count: result.links?.length || 0,
      links_count: result.articles?.length || 0,
      from_cache: result.fromCache || false,
      timestamp: result.timestamp
    }));
    
    await fs.writeFile(
      path.join(CONFIGS.outputDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    // 保存详细数据（每个URL一个文件）
    for (const result of results) {
      if (result.status === 'success' && result.extracted) {
        const urlObj = new URL(result.url);
        const filename = `${urlObj.hostname}${urlObj.pathname.replace(/\//g, '_')}.json`;
        
        await fs.writeFile(
          path.join(CONFIGS.outputDir, filename),
          JSON.stringify(result.extracted, null, 2)
        );
        
        // 可选：保存原始HTML
        if (CONFIGS.saveRawHtml && result.data) {
          await fs.writeFile(
            path.join(CONFIGS.outputDir, `${filename}.html`),
            result.data
          );
        }
      }
    }
    
    console.log(`结果已保存到 ${CONFIGS.outputDir} 目录`);
  } catch (error) {
    console.error('保存结果失败:', error);
  }
}

/**
 * 主函数：获取并处理所有新闻源
 * @param urls - URL数组
 * @param options - 配置选项
 * @returns 所有处理结果
 */
export async function getAllNews(
  urls: string[] = NEWS_SOURCES, 
  options: Partial<CrawlerConfig> = {}
): Promise<RequestResult[]> {
  try {
    console.time('getAllNews');
    
    // 合并选项和CONFIG
    const mergedOptions = { ...CONFIGS, ...options };
    
    console.log(`开始抓取 ${urls.length} 个URL...`);
    
    // 获取所有页面的HTML
    const results: RequestResult[] = await batchFetchWithConcurrency(urls, mergedOptions);
    
    // 统计
    const successful = results.filter((result: RequestResult) => result.status === 'success').length;
    const failed = results.filter((result: RequestResult) => result.status === 'error').length;
    const fromCache = results.filter((result: RequestResult) => result.fromCache).length;
    
    console.log(`请求完成：${successful}个成功 (${fromCache}个来自缓存)，${failed}个失败`);
    
    // 使用Cheerio提取内容
    console.log('正在提取内容...');
    // 初始化杂志名称映射（只需初始化一次）
    const { urlToMagazine, domainToMagazine } = createMagazineUrlMap(NEWS_OFFICE);

    const processedResults = results.map((result: RequestResult) => {
      if (result.status === 'success' && result.data) {
        try {
          const tempData=extractContentWithCheerio(result.data, result.url);
          result.title = getMagazineName(result.url, urlToMagazine, domainToMagazine);
          
          // 从提取的内容更新links和articles到主结果对象
          result.links = tempData.links || [];
          result.articles = tempData.articles || [];
          
          // 移除原始HTML以节省内存
          if (!mergedOptions.saveRawHtml) {
            delete result.data;
          }
        } catch (error: any) {
          console.error(`处理内容失败 (${result.url}):`, error);
          // 处理失败时，确保有空数组
          result.links = [];
          result.articles = [];
          result.title='Error extracting content'
          
        }
      } else if (result.status === 'error') {
        // 确保错误结果有空数组
        result.links = [];
        result.articles = [];
      }
      return result;
    });
    
    // 保存结果
    if (mergedOptions.outputDir) {
      await saveResults(processedResults);
    }
    
    console.timeEnd('getAllNews');
    return processedResults;
  } catch (error: any) {
    console.error('抓取过程中发生错误:', error);
    throw error;
  }
}