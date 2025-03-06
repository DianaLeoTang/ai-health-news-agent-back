/*
 * @Author: Diana Tang
 * @Date: 2025-03-07 03:57:05
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/services/types.ts
 */
interface EmailConfig {
    USER: string | undefined;
    PASS: string | undefined;
  }
  
  interface ServerConfig {
    PORT: string | number;
    NODE_ENV:string;
  }
  
  interface Config {
    NEWS_SOURCES: string[];
    EMAIL: EmailConfig;
    SERVER: ServerConfig;
  }
  // 类型定义
  interface CacheData<T> {
    data: T;
    timestamp: number;
  }
  
  interface RequestResult {
    url: string;
    data?: string;
    status: 'success' | 'error';
    headers?: any;
    statusCode?: number;
    errorCode?: string;
    error?: string;
    timestamp: number;
    fromCache?: 'memory' | 'file' | false;
    extracted?: ExtractedContent;
  }
  
  interface ExtractedContent {
    url: string;
    title: string;
    description: string;
    links: Link[];
    articles: Article[];
    metadata: Record<string, string>;
    hostname: string;
    extracted_at: string;
    error?: string;
  }
  
  interface Link {
    url: string;
    text: string;
  }
  
  interface Article {
    title: string;
    url: string;
    date: string;
    summary: string;
  }
  
  interface SiteSelectors {
    [key: string]: string;
  }
  
  interface DomainSelectors {
    [domain: string]: SiteSelectors;
  }
  
  interface CrawlerConfig {
    // 并发控制
    concurrentLimit: number;
    
    // 请求配置
    requestTimeout: number;
    retries: number;
    retryDelay: number;
    
    // 缓存配置
    useCache: boolean;
    cacheDir: string;
    cacheTTL: number;
    
    // 代理配置
    useProxy: boolean;
    proxyUrl: string;
    
    // 输出配置
    outputDir: string;
    saveRawHtml: boolean;
    
    // 提取配置
    selectors: {
      [key: string]: string | SiteSelectors;
    } & DomainSelectors;
  }