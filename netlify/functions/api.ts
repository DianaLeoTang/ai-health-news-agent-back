
import serverless from 'serverless-http';
import app from '../../src/app';  // 导入你的实际Express应用

// 使用配置选项
export const handler = serverless(app, {
  basePath: '/.netlify/functions/api'
});