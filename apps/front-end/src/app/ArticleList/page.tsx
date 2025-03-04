/*
 * @Author: Diana Tang
 * @Date: 2025-03-04 13:31:30
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/apps/front-end/src/app/ArticleList/page.tsx
 */
"use client"

// 这个文件只导出一个包装组件，真正的实现放在单独的文件中
import dynamic from 'next/dynamic';

// 动态导入ArticleListContent组件，并禁用SSR
const ArticleList = dynamic(() => import('./ArticleListContent'), {
  ssr: false,
  loading: () => <div className="p-4 text-center">加载中...</div>
});

export default ArticleList;