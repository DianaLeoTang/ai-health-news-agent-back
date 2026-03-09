# WHO爬虫快速测试指南

## 测试步骤

### 1️⃣ 编译代码
```bash
yarn build
```

### 2️⃣ 启动服务器
```bash
yarn dev
```

等待看到类似这样的输出：
```
Server is running on http://localhost:4000
```

### 3️⃣ 测试API接口

打开新的终端窗口，运行以下命令：

#### 测试1: 获取最新30条WHO新闻（最快）
```bash
curl "http://localhost:4000/who-news/latest?count=30"
```

**预期结果：**
- 返回约30条WHO新闻
- 包含完整的标题、URL、日期等信息
- 比之前的10条多很多

#### 测试2: 获取前2页新闻
```bash
curl "http://localhost:4000/who-news/range?start=1&end=2"
```

**预期结果：**
- 返回约20条新闻（每页10条）
- 显示抓取了2页

#### 测试3: 获取前3页新闻（推荐）
```bash
curl "http://localhost:4000/who-news/all?maxPages=3&delayMs=1000"
```

**预期结果：**
- 返回约30条新闻
- 可以看到抓取进度

### 4️⃣ 在浏览器中测试

打开浏览器，访问以下URL：

```
http://localhost:4000/who-news/latest?count=50
```

你会看到JSON格式的响应，包含大量WHO新闻！

## 快速对比验证

### 之前的数据（只有10条）
```bash
# 查看之前的数据
cat data/2026-01-02/www.who.int_news-room_headlines.json | grep -c "\"title\""
```
输出应该是：10

### 现在的数据（50+条）
```bash
# 测试新爬虫
curl "http://localhost:4000/who-news/latest?count=100" | grep -o "\"title\"" | wc -l
```
输出应该是：100左右

## 保存测试结果

如果你想保存测试结果到文件：

```bash
# 保存最新50条新闻
curl "http://localhost:4000/who-news/latest?count=50" > who-test-result.json

# 查看结果
cat who-test-result.json | jq '.data.articles | length'
```

## 常见问题

### Q: 提示端口被占用？
```bash
# 查找占用端口的进程
lsof -i :4000

# 杀掉进程
kill -9 <PID>
```

### Q: curl命令找不到？
使用浏览器直接访问URL，或者安装curl：
```bash
brew install curl
```

### Q: 想看更详细的输出？
添加 `-v` 参数：
```bash
curl -v "http://localhost:4000/who-news/latest?count=30"
```

### Q: JSON格式化查看？
安装jq工具：
```bash
brew install jq

# 使用jq格式化输出
curl "http://localhost:4000/who-news/latest?count=30" | jq '.'
```

## 性能测试

测试不同抓取方式的速度：

```bash
# 测试1: 快速模式（最快）
time curl "http://localhost:4000/who-news/latest?count=30"

# 测试2: 范围模式
time curl "http://localhost:4000/who-news/range?start=1&end=3"

# 测试3: 完整模式（较慢）
time curl "http://localhost:4000/who-news/all?maxPages=5"
```

## 验证数据质量

检查返回的数据是否包含所有必要字段：

```bash
curl "http://localhost:4000/who-news/latest?count=10" | jq '.data.articles[0]'
```

应该看到：
```json
{
  "title": "WHO validates Brazil for eliminating...",
  "url": "https://www.who.int/news/item/...",
  "date": "18 December 2025",
  "summary": "WHO validates Brazil for eliminating...",
  "type": "News release"
}
```

## 成功标志

如果你看到以下内容，说明测试成功：

✅ 返回的新闻数量 > 10条  
✅ 包含完整的URL和标题  
✅ 有日期信息  
✅ 没有重复的新闻  
✅ 返回了 `totalPages` 和 `crawledPages` 字段  

## 下一步

测试成功后，你可以：

1. **集成到现有系统**：替换原来的WHO数据源
2. **设置定时任务**：每天自动更新WHO新闻
3. **保存到数据库**：将抓取的数据持久化
4. **添加通知**：有新闻时发送邮件或短信

查看 `WHO_CRAWLER_GUIDE.md` 了解详细的集成方案。

