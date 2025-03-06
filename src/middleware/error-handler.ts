/*
 * @Author: Diana Tang
 * @Date: 2025-03-06 19:03:59
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/middleware/error-handler.ts
 */
 const errorHandler = (err:any, req:any, res:any, next:any) => {
    console.error(`[${new Date().toISOString()}] Error:`, err);
    
    // 返回适当的错误响应
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message,
      status: err.status || 500
    });
  };
  export default errorHandler;