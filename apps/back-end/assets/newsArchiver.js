// apps/back-end/src/services/newsArchiver.js
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const schedule = require('node-schedule');

/**
 * 将新闻数据保存为Markdown文件
 */
class NewsArchiver {
  constructor(options = {}) {
    // 默认配置
    this.config = {
      apiUrl: 'http://localhost:3000/news',
      archiveDir: path.join(process.cwd(), 'news-archives'),
      scheduleCron: '0 0 * * *', // 默认每天午夜执行
      dateFormat: 'YYYY-MM-DD',
      ...options
    };
    
    // 确保存档目录存在
    this.ensureArchiveDir();
  }
  
  /**
   * 确保存档目录存在
   */
  async ensureArchiveDir() {
    try {
      await fs.mkdir(this.config.archiveDir, { recursive: true });
      console.log(`新闻存档目录已创建: ${this.config.archiveDir}`);
    } catch (error) {
      console.error('创建新闻存档目录时出错:', error);
    }
  }
  
  /**
   * 获取当前日期的格式化字符串
   */
  getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * 从API获取新闻数据
   */
  async fetchNews() {
    try {
      console.log(`从 ${this.config.apiUrl} 获取新闻数据...`);
      const response = await axios.get(this.config.apiUrl);
      return response.data;
    } catch (error) {
      console.error('获取新闻数据失败:', error.message);
      return [];
    }
  }
  
  /**
   * 将新闻数据转换为Markdown格式
   */
  convertToMarkdown(newsItems) {
    if (!newsItems || newsItems.length === 0) {
      return '# 今日新闻\n\n*没有新闻数据可用*';
    }
    
    const date = this.getFormattedDate();
    let markdown = `# 新闻热榜 (${date})\n\n`;
    
    newsItems.forEach((item, index) => {
      const number = index + 1;
      const title = item.title || '无标题';
      const link = item.link || '#';
      const summary = item.summary ? ` - ${item.summary}` : '';
      
      markdown += `${number}. [${title}](${link})${summary}\n`;
    });
    
    return markdown;
  }
  
  /**
   * 保存Markdown文件
   */
  async saveMarkdownFile(markdown) {
    const date = this.getFormattedDate();
    const filename = `news-${date}.md`;
    const filePath = path.join(this.config.archiveDir, filename);
    
    try {
      await fs.writeFile(filePath, markdown, 'utf8');
      console.log(`新闻数据已保存到 ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('保存Markdown文件失败:', error);
      throw error;
    }
  }
  
  /**
   * 执行完整的存档过程
   */
  async archiveNews() {
    try {
      console.log('开始存档今日新闻...');
      
      // 获取新闻
      const newsItems = await this.fetchNews();
      
      // 转换为Markdown
      const markdown = this.convertToMarkdown(newsItems);
      
      // 保存文件
      const filePath = await this.saveMarkdownFile(markdown);
      
      console.log(`今日新闻存档完成: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('新闻存档过程失败:', error);
    }
  }
  
  /**
   * 手动触发存档过程
   */
  async manualArchive() {
    return this.archiveNews();
  }
  
  /**
   * 启动定时存档任务
   */
  startScheduler() {
    console.log(`定时任务已启动，计划: ${this.config.scheduleCron}`);
    
    this.scheduler = schedule.scheduleJob(this.config.scheduleCron, async () => {
      console.log('执行定时新闻存档任务...');
      await this.archiveNews();
    });
    
    return this.scheduler;
  }
  
  /**
   * 停止定时存档任务
   */
  stopScheduler() {
    if (this.scheduler) {
      this.scheduler.cancel();
      console.log('定时新闻存档任务已停止');
    }
  }
}

module.exports = NewsArchiver;