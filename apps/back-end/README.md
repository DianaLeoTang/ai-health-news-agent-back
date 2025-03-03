<!--
 * @Author: Diana Tang
 * @Date: 2025-03-03 14:29:46
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/apps/back-end/README.md
-->

## 后端项目目录结构
AI-Health-News-Agent/
│── src/
│   ├── fetchNews.js        # 处理新闻抓取
│   ├── generateReport.js   # 生成 Markdown/HTML 报告
│   ├── sendEmail.js        # 发送邮件
│   ├── server.js           # Express API 服务器
│── config/
│   ├── config.js           # 配置文件（邮件、新闻来源等）
│── reports/
│   ├── report.md           # 生成的 Markdown 报告
│   ├── report.html         # 生成的 HTML 报告
│── package.json            # 项目依赖管理
│── README.md               # 项目说明
│── .env                    # 存储环境变量（如邮件凭据）

## 📌 功能
- 爬取 WHO、CDC、Nature 等公共卫生新闻
- 生成 Markdown 和 HTML 报告
- 通过 API 提供新闻数据
- 每天 8:00 自动执行并发送邮件

## 🚀 安装与运行

### 1️⃣ 克隆项目
```sh
git clone https://github.com/your-repo/AI-Health-News-Agent.git
cd AI-Health-News-Agent
