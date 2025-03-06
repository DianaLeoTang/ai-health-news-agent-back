/*
 * @Author: Diana Tang
 * @Date: 2025-03-06 21:12:18
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/netlify/functions/simple-api.ts
 */
// netlify/functions/simple-api.ts
import { Handler } from '@netlify/functions';
export const handler:Handler = async (event) => {
    // 简单的路由逻辑
    const path = event.path.replace('/.netlify/functions/simple-api', '');
    
    if (path === '/hello') {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Hello endpoint" })
      };
    }
    
    if (path === '/news') {
      return {
        statusCode: 200,
        body: JSON.stringify({ news: [{ title: "Test News", content: "This is a test" }] })
      };
    }
    
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Not found" })
    };
  };