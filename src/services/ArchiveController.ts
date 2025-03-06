
import { Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import NewsArchiver from './NewsArchiver';

/**
 * 处理新闻存档相关API请求的控制器
 */
export class ArchiveController {
  private newsArchiver: NewsArchiver;

  /**
   * 创建存档控制器
   * @param newsArchiver 新闻存档服务实例
   */
  constructor(newsArchiver: NewsArchiver) {
    this.newsArchiver = newsArchiver;
  }

  /**
   * 手动触发存档过程
   */
  public manualArchive = async (req: Request, res: Response): Promise<void> => {
    try {
      const filePath = await this.newsArchiver.archiveNews();
      res.json({ success: true, filePath });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: errorMessage });
    }
  };

  /**
   * 获取所有存档文件列表
   */
  public getArchives = async (req: Request, res: Response): Promise<void> => {
    try {
      const archiveDir = this.newsArchiver.getArchiveDir();
      const files = await fs.readdir(archiveDir);
      
      const archivePromises = files
        .filter(file => file.endsWith('.md'))
        .map(async (file) => {
          const filePath = path.join(archiveDir, file);
          const stats = await fs.stat(filePath);
          
          return {
            filename: file,
            date: file.replace('news-', '').replace('.md', ''),
            path: `/archives/${file}`,
            size: stats.size,
            created: stats.birthtime
          };
        });
      
      const archives = await Promise.all(archivePromises);
      // 按日期降序排序（最新的在前面）
      archives.sort((a, b) => b.date.localeCompare(a.date));
      
      res.json(archives);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMessage });
    }
  };

  /**
   * 获取特定存档文件的内容
   */
  public getArchiveContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename } = req.params;
      const archiveDir = this.newsArchiver.getArchiveDir();
      const filePath = path.join(archiveDir, filename);
      
      // 检查文件是否存在
      await fs.access(filePath);
      
      // 读取文件内容
      const content = await fs.readFile(filePath, 'utf8');
      
      // 根据Accept头决定如何返回内容
      const acceptHeader = req.headers.accept || '';
      
      if (acceptHeader.includes('text/html')) {
        // 如果客户端请求HTML，将Markdown转换为HTML
        const htmlContent = this.markdownToHtml(content);
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
      } else if (acceptHeader.includes('text/markdown')) {
        // 如果客户端请求Markdown，直接返回
        res.setHeader('Content-Type', 'text/markdown');
        res.send(content);
      } else {
        // 默认作为下载处理
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(404).json({ error: errorMessage });
    }
  };

  /**
   * 将Markdown内容转换为简单的HTML
   * 注意：这是一个非常简单的转换，实际应用中可能需要使用专门的Markdown解析库
   */
  private markdownToHtml(markdown: string): string {
    let html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>新闻存档</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
        a { color: #0366d6; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>`;
    
    // 转换H1标题
    html += markdown.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // 转换链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // 转换行
    html = html.replace(/\n/g, '<br>');
    
    html += `</body></html>`;
    return html;
  }
}

export default ArchiveController;