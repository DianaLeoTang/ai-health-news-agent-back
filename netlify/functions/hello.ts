/*
 * @Author: Diana Tang
 * @Date: 2025-03-06 20:58:51
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/netlify/functions/hello.ts
 */
export const handler = async () => {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Hello World' })
    };
  };