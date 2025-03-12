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
  // 其他可能的属性
  [key: string]: any;
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
// Extend RequestResult to include 'pending' status
export interface ExtendedRequestResult extends Omit<RequestResult, 'status'> {
  status: 'success' | 'error' | 'pending';
}

// 任务状态类型
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'error';

// 错误响应类型
export interface ErrorResponse {
  status?: number;
  statusText?: string;
  data?: any;
}

// 错误类型
export interface TaskError {
  message: string;
  response?: ErrorResponse;
  stack?: string;
  code?: string;
}

// 任务结果类型
export interface TaskResult {
  url: string;
  status: 'success' | 'error';
  statusCode?: number;
  timestamp: number;
  links: string[];
  articles: any[]; // 这里可以根据实际文章结构定义更具体的类型
  title: string;
}

// 任务类型
export interface Task {
  url: string;
  status: TaskStatus;
  result: TaskResult | null;
  // 其他可能的任务属性...
}
