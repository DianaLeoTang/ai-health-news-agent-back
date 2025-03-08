/*
 * @Author: Diana Tang
 * @Date: 2025-03-07 03:57:05
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/services/types.ts
 */
/*
 * @Author: Diana Tang
 * @Date: 2025-03-07 03:57:05
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/services/types.ts
 */

export interface EmailConfig {
  USER: string | undefined;
  PASS: string | undefined;
}

export interface ServerConfig {
  PORT: string | number;
  NODE_ENV: string;
}
export interface MagazineInfo {
  title: string;
  url: string;
}
export interface Config {
  NEWS_SOURCES: string[];
  EMAIL: EmailConfig;
  SERVER: ServerConfig;
  NEWS_SOURCES_FEED:string[];
  NEWS_OFFICEAA:Array<{ [journalName: string]: string }>;
  NEWS_SOURCESAA:string[];
  NEWS_OFFICE:MagazineInfo[]
}

// 类型定义
export interface CacheData<T> {
  data: T;
  timestamp: number;
}

export interface RequestResult {
  url: string;
  data?: string;
  status: 'success' | 'error';
  statusCode?: number;
  errorCode?: string;
  error?: string;
  timestamp: number;
  extracted?: ExtractedContent;
  fromCache?: 'memory' | 'file' | null | undefined| string;
  links: Link[];
  articles: Article[];
  title?: string;  // 添加这个可选字段
}

export interface ExtractedContent {
  url: string;
  title?: string;
  description?: string;
  links: Link[];
  articles: Article[];
  metadata: Record<string, string>;
  hostname: string;
  extracted_at: string;
  error?: string;
}

export interface Link {
  url: string;
  title: string;
}

export interface Article {
  title: string;
  url: string;
  date: string;
  summary: string;
}

export interface SiteSelectors {
  [key: string]: string;
}

export interface DomainSelectors {
  [domain: string]: SiteSelectors;
}

export interface CrawlerConfig {
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
    [key: string]: SiteSelectors | string;
  };
}