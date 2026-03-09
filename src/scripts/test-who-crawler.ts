/*
 * @Author: Diana Tang
 * @Date: 2026-01-01
 * @Description: 测试WHO爬虫
 */

import { fetchAllWHONews, fetchLatestWHONews, fetchWHONewsRange } from '../services/whoNewsCrawler';
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  console.log('========================================');
  console.log('WHO新闻爬虫测试');
  console.log('========================================\n');

  try {
    // 选项1: 抓取前3页（约30条新闻）
    console.log('方案1: 抓取前3页新闻...\n');
    const result1 = await fetchAllWHONews({
      maxPages: 3,
      delayMs: 1000
    });

    console.log('\n--- 抓取结果 ---');
    console.log(`总页数: ${result1.totalPages}`);
    console.log(`已抓取页数: ${result1.crawledPages}`);
    console.log(`获取新闻数: ${result1.articles.length}`);
    console.log('\n前5条新闻:');
    result1.articles.slice(0, 5).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   日期: ${article.date}`);
      console.log(`   链接: ${article.url}\n`);
    });

    // 保存结果到文件
    const outputDir = path.join(process.cwd(), 'data', 'who-enhanced');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputFile = path.join(outputDir, `who-headlines-${Date.now()}.json`);
    await fs.writeFile(
      outputFile,
      JSON.stringify(result1, null, 2),
      'utf-8'
    );

    console.log(`\n✓ 结果已保存到: ${outputFile}`);

    // 选项2: 只获取最新50条新闻
    console.log('\n\n方案2: 快速获取最新50条新闻...\n');
    const result2 = await fetchLatestWHONews(50);
    console.log(`获取到 ${result2.articles.length} 条最新新闻`);

    // 选项3: 抓取指定页面范围
    console.log('\n\n方案3: 抓取第1-2页...\n');
    const result3 = await fetchWHONewsRange(1, 2);
    console.log(`获取到 ${result3.articles.length} 条新闻`);

    console.log('\n========================================');
    console.log('测试完成！');
    console.log('========================================');

  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
}

