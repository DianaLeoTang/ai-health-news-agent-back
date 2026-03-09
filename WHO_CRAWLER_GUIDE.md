# WHO新闻爬虫增强版使用指南

## 问题描述

之前的爬虫只能抓取WHO Headlines页面的第一页（10条新闻），但WHO网站实际上有多个分页，包含大量历史新闻。

## 解决方案

创建了专门的WHO爬虫 (`whoNewsCrawler.ts`)，支持：
- ✅ 自动检测总页数
- ✅ 抓取所有分页或指定页数
- ✅ 自动去重
- ✅ 可配置延迟避免被封
- ✅ 支持快速获取最新N条新闻

## 使用方法

### 方法1: 通过API调用（推荐）

#### 1. 获取所有WHO新闻（可指定页数）

```bash
# 获取前5页（约50条新闻）
GET http://localhost:4000/who-news/all?maxPages=5&startPage=1&delayMs=1000

# 获取所有页面（可能需要较长时间）
GET http://localhost:4000/who-news/all
```

**参数说明:**
- `maxPages`: 最多抓取多少页（可选，默认全部）
- `startPage`: 从第几页开始（可选，默认1）
- `delayMs`: 每页之间的延迟毫秒数（可选，默认1000）

**响应示例:**
```json
{
  "ok": true,
  "data": {
    "url": "https://www.who.int/news-room/headlines",
    "title": "WHO Headlines",
    "articles": [
      {
        "title": "WHO validates Brazil for eliminating mother-to-child transmission of HIV",
        "url": "https://www.who.int/news/item/18-12-2025-who-validates-brazil-for-eliminating-mother-to-child-transmission-of-hiv",
        "date": "18 December 2025",
        "summary": "WHO validates Brazil for eliminating mother-to-child transmission of HIV",
        "type": "News release"
      },
      // ... 更多新闻
    ],
    "totalPages": 10,
    "crawledPages": 5,
    "timestamp": 1704153600000
  },
  "status": 200
}
```

#### 2. 快速获取最新N条新闻

```bash
# 获取最新50条新闻（自动计算需要抓取的页数）
GET http://localhost:4000/who-news/latest?count=50

# 获取最新100条新闻
GET http://localhost:4000/who-news/latest?count=100
```

**参数说明:**
- `count`: 需要的新闻数量（可选，默认50）

#### 3. 获取指定页面范围的新闻

```bash
# 获取第1-3页的新闻
GET http://localhost:4000/who-news/range?start=1&end=3

# 获取第5-10页的新闻
GET http://localhost:4000/who-news/range?start=5&end=10
```

**参数说明:**
- `start`: 起始页（必需）
- `end`: 结束页（必需）

### 方法2: 直接运行测试脚本

```bash
# 编译TypeScript
npm run build

# 运行测试脚本
npx ts-node src/scripts/test-who-crawler.ts
```

测试脚本会：
1. 抓取前3页新闻
2. 快速获取最新50条新闻
3. 抓取指定页面范围
4. 将结果保存到 `data/who-enhanced/` 目录

### 方法3: 在代码中使用

```typescript
import { fetchAllWHONews, fetchLatestWHONews, fetchWHONewsRange } from './services/whoNewsCrawler';

// 示例1: 获取前5页
const result1 = await fetchAllWHONews({
  maxPages: 5,
  startPage: 1,
  delayMs: 1000
});

// 示例2: 快速获取最新50条
const result2 = await fetchLatestWHONews(50);

// 示例3: 获取指定范围
const result3 = await fetchWHONewsRange(1, 3);

console.log(`获取了 ${result1.articles.length} 条新闻`);
```

## 数据对比

### 之前（只有第一页）
- 新闻数量: **10条**
- 覆盖时间: 约1周
- 数据完整性: ❌ 不完整

### 现在（支持分页）
- 新闻数量: **100+条**（取决于抓取页数）
- 覆盖时间: 可追溯数月甚至数年
- 数据完整性: ✅ 完整
- 分页支持: ✅ 支持
- 自定义范围: ✅ 支持

## 性能建议

### 1. 首次抓取建议

```bash
# 首次抓取建议获取前10页（约100条新闻）
GET http://localhost:4000/who-news/all?maxPages=10&delayMs=1500
```

- 设置较长的延迟（1500ms）避免被封
- 不要一次性抓取太多页

### 2. 定期更新建议

```bash
# 每天只抓取最新的2-3页即可
GET http://localhost:4000/who-news/range?start=1&end=3
```

或使用快速模式：

```bash
GET http://localhost:4000/who-news/latest?count=30
```

### 3. 历史数据建议

```bash
# 分批抓取历史数据，每次5-10页
GET http://localhost:4000/who-news/range?start=1&end=5
GET http://localhost:4000/who-news/range?start=6&end=10
GET http://localhost:4000/who-news/range?start=11&end=15
```

## 集成到现有系统

### 替换现有WHO数据源

在 `src/services/getAllNews.ts` 中添加WHO专用处理：

```typescript
import { fetchAllWHONews } from './whoNewsCrawler';

// 在获取新闻的函数中
if (url.includes('who.int/news-room/headlines')) {
  // 使用增强版WHO爬虫
  const whoData = await fetchAllWHONews({ maxPages: 5 });
  // 转换为统一格式
  result.articles = whoData.articles;
  result.title = whoData.title;
}
```

### 添加定时任务

在 `src/services/scheduler.ts` 中添加：

```typescript
import { fetchLatestWHONews } from './whoNewsCrawler';

// 每天早上8点更新WHO新闻
schedule.scheduleJob('0 8 * * *', async () => {
  console.log('开始更新WHO新闻...');
  const result = await fetchLatestWHONews(50);
  // 保存到数据库或文件
  await saveWHONews(result);
});
```

## 常见问题

### Q1: 为什么只抓取到10条新闻？
**A:** 之前的爬虫只抓取第一页。现在使用新的WHO爬虫可以抓取所有分页。

### Q2: 抓取太慢怎么办？
**A:** 
- 减少 `maxPages` 参数
- 减少 `delayMs` 参数（但可能被封IP）
- 使用 `fetchLatestWHONews` 快速模式

### Q3: 会不会被WHO封IP？
**A:** 
- 已设置合理的延迟（默认1000ms）
- 使用了正常的User-Agent
- 建议不要频繁大量抓取
- 可以考虑使用代理

### Q4: 如何更新到最新数据？
**A:** 
```bash
# 方法1: 只抓取前2页（最新约20条）
GET http://localhost:4000/who-news/range?start=1&end=2

# 方法2: 使用快速模式
GET http://localhost:4000/who-news/latest?count=30
```

### Q5: 数据保存在哪里？
**A:** 
- API调用: 返回JSON数据，需要自己保存
- 测试脚本: 保存在 `data/who-enhanced/` 目录
- 可以集成到现有的 `getAllNews` 服务中

## 下一步优化建议

1. **添加数据库存储**: 将抓取的新闻保存到数据库
2. **增量更新**: 只抓取新增的新闻，避免重复
3. **错误重试**: 添加更完善的错误处理和重试机制
4. **代理支持**: 支持配置代理避免IP被封
5. **缓存机制**: 对已抓取的页面进行缓存
6. **通知机制**: 新闻更新时发送邮件或短信通知

## 测试验证

```bash
# 1. 启动服务器
npm run dev

# 2. 在另一个终端测试API
curl "http://localhost:4000/who-news/latest?count=50"

# 3. 查看返回的新闻数量
# 应该看到50条左右的新闻，而不是只有10条
```

## 总结

通过使用新的WHO爬虫：
- ✅ 解决了只能抓取10条新闻的问题
- ✅ 可以获取WHO网站上的所有历史新闻
- ✅ 支持灵活的分页控制
- ✅ 提供了多种使用方式（API、脚本、代码集成）
- ✅ 性能和安全性都有保障

现在你可以获取到完整的WHO新闻数据了！🎉

