import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import fs from 'fs';
import pathModule from 'path';
// 使用别名导入避免命名冲突
import * as pdfjs from 'pdfjs-dist';

// 尝试设置PDF.js工作线程
try {
  const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.js');
  if (typeof pdfjs.GlobalWorkerOptions !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }
} catch (e) {
  console.log('PDF.js worker setup failed, continuing without it:', e);
}

// 创建临时目录
const tempDir = pathModule.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export class PdfService {
  private r2Client: S3Client;
  private bucketName: string;

  constructor() {
    this.r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ''
      }
    });
    this.bucketName = process.env.R2_BUCKET_NAME || 'publichealthassets';
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filePath: string): Promise<any> {
    // 尝试不同的可能路径
    const possiblePaths = [
      filePath,
      `books/${filePath}`,
      filePath.replace('books/', '')
    ];

    for (const possiblePath of possiblePaths) {
      try {
        console.log(`尝试获取路径: ${possiblePath}`);
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: possiblePath
        });

        const response = await this.r2Client.send(command);

        // 读取文件预览
        const fileStream = response.Body as Readable;
        const chunks: Buffer[] = [];
        let bytesRead = 0;
        const maxBytes = 100 * 1024;

        for await (const chunk of fileStream) {
          chunks.push(Buffer.from(chunk));
          bytesRead += chunk.length;
          if (bytesRead >= maxBytes) break;
        }

        const filePreview = Buffer.concat(chunks);

        return {
          success: true,
          data: {
            fileName: filePath,
            actualPath: possiblePath,
            contentType: response.ContentType,
            contentLength: response.ContentLength,
            lastModified: response.LastModified,
            previewSize: filePreview.length,
            fileExists: true,
            metadata: response.Metadata
          }
        };
      } catch (error) {
        console.log(`路径 ${possiblePath} 获取失败: ${(error as Error).message}`);
      }
    }

    return {
      success: false,
      error: '在任何可能的路径中都未找到该文件',
      triedPaths: possiblePaths
    };
  }

  /**
   * 获取PDF文件并保存到临时位置
   */
  private async downloadToTemp(filePath: string): Promise<{
    success: boolean;
    tempFilePath?: string;
    actualPath?: string;
    error?: string;
    triedPaths?: string[];
  }> {
    // 尝试不同的可能路径
    const possiblePaths = [
      filePath,
      `books/${filePath}`,
      filePath.replace('books/', '')
    ];

    for (const possiblePath of possiblePaths) {
      try {
        console.log(`尝试下载路径: ${possiblePath}`);
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: possiblePath
        });

        const response = await this.r2Client.send(command);
        const fileStream = response.Body as Readable;

        // 创建临时文件
        const fileName = possiblePath.split('/').pop() || 'tempfile';
        const tempFilePath = pathModule.join(tempDir, `temp-${Date.now()}-${fileName}`);
        const writeStream = fs.createWriteStream(tempFilePath);

        // 使用流式处理下载文件
        await new Promise<void>((resolve, reject) => {
          fileStream.pipe(writeStream)
            .on('finish', resolve)
            .on('error', reject);
        });

        console.log(`文件已下载到: ${tempFilePath}`);
        return {
          success: true,
          tempFilePath,
          actualPath: possiblePath
        };
      } catch (error) {
        console.log(`路径 ${possiblePath} 下载失败:`, error);
      }
    }

    return {
      success: false,
      error: '无法下载文件',
      triedPaths: possiblePaths
    };
  }

  /**
   * 获取小说信息 
   */
  async getNovelInfo(filePath: string): Promise<any> {
    try {
      // 先获取文件基本信息
      const fileInfo = await this.getFileInfo(filePath);
      if (!fileInfo.success) {
        return fileInfo;
      }

      // 下载文件到临时位置
      const downloadResult = await this.downloadToTemp(filePath);
      if (!downloadResult.success || !downloadResult.tempFilePath) {
        return {
          success: false,
          error: '下载文件失败',
          basicInfo: fileInfo.data
        };
      }

      try {
        // 使用pdfjs解析PDF
        const data = new Uint8Array(fs.readFileSync(downloadResult.tempFilePath));
        
        // 创建加载任务
        const loadingTask = pdfjs.getDocument({ data });
        const pdfDoc = await loadingTask.promise;
        
        // 提取基本信息
        const numPages = pdfDoc.numPages;
        console.log(`PDF页数: ${numPages}`);

        // 尝试提取章节
        let chapters = [];
        try {
          chapters = await this.extractChapters(pdfDoc);
        } catch (error) {
          console.error('章节提取失败:', error);
          // 提供一个默认章节
          chapters = [{
            title: '全文内容',
            startPage: 1,
            endPage: numPages,
            content: '章节提取失败，请查看全文。'
          }];
        }

        return {
          success: true,
          data: {
            title: this.extractBookTitle(filePath),
            actualPath: downloadResult.actualPath,
            totalPages: numPages,
            totalChapters: chapters.length,
            fileSize: fileInfo.data.contentLength,
            contentType: fileInfo.data.contentType,
            chapters: chapters.map(ch => ({
              title: ch.title,
              startPage: ch.startPage,
              endPage: ch.endPage,
              contentPreview: ch.content.substring(0, 200) + '...'
            }))
          }
        };
      } finally {
        // 清理临时文件
        try {
          if (fs.existsSync(downloadResult.tempFilePath)) {
            fs.unlinkSync(downloadResult.tempFilePath);
          }
        } catch (e) {
          console.error('清理临时文件失败:', e);
        }
      }
    } catch (error) {
      console.error('获取小说信息失败:', error);
      return {
        success: false,
        error: `获取小说信息失败: ${(error as Error).message}`
      };
    }
  }

  /**
   * 获取章节内容
   */
  async getChapterContent(filePath: string, chapterIndex: number): Promise<any> {
    try {
      // 先获取文件基本信息
      const fileInfo = await this.getFileInfo(filePath);
      if (!fileInfo.success) {
        return fileInfo;
      }

      // 下载文件到临时位置
      const downloadResult = await this.downloadToTemp(filePath);
      if (!downloadResult.success || !downloadResult.tempFilePath) {
        return {
          success: false,
          error: '下载文件失败',
          basicInfo: fileInfo.data
        };
      }

      try {
        // 使用pdfjs解析PDF
        const data = new Uint8Array(fs.readFileSync(downloadResult.tempFilePath));
        
        // 创建加载任务
        const loadingTask = pdfjs.getDocument({ data });
        const pdfDoc = await loadingTask.promise;
        
        // 提取基本信息
        const numPages = pdfDoc.numPages;

        // 尝试提取章节
        let chapters = [];
        try {
          chapters = await this.extractChapters(pdfDoc);
        } catch (error) {
          console.error('章节提取失败:', error);
          // 提供一个默认章节
          chapters = [{
            title: '全文内容',
            startPage: 1,
            endPage: numPages,
            content: await this.extractAllText(pdfDoc, 100) // 限制为前100页
          }];
        }

        // 检查章节索引
        if (chapterIndex < 0 || chapterIndex >= chapters.length) {
          return {
            success: false,
            error: `章节索引超出范围: 0-${chapters.length-1}`,
            totalChapters: chapters.length
          };
        }

        const chapter = chapters[chapterIndex];
        
        return {
          success: true,
          data: {
            title: this.extractBookTitle(filePath),
            actualPath: downloadResult.actualPath,
            currentChapter: chapterIndex + 1,
            totalChapters: chapters.length,
            chapterTitle: chapter.title,
            content: chapter.content,
            startPage: chapter.startPage,
            endPage: chapter.endPage,
            nextChapter: chapterIndex < chapters.length - 1 ? chapterIndex + 1 : null,
            prevChapter: chapterIndex > 0 ? chapterIndex - 1 : null
          }
        };
      } finally {
        // 清理临时文件
        try {
          if (fs.existsSync(downloadResult.tempFilePath)) {
            fs.unlinkSync(downloadResult.tempFilePath);
          }
        } catch (e) {
          console.error('清理临时文件失败:', e);
        }
      }
    } catch (error) {
      console.error('获取章节内容失败:', error);
      return {
        success: false,
        error: `获取章节内容失败: ${(error as Error).message}`
      };
    }
  }

  /**
   * 提取所有文本
   */
  private async extractAllText(pdfDoc: any, maxPages?: number): Promise<string> {
    const numPages = pdfDoc.numPages;
    const limit = maxPages ? Math.min(numPages, maxPages) : numPages;
    let text = '';
    
    for (let i = 1; i <= limit; i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
        text += pageText + ' ';
        
        if (i % 10 === 0) {
          console.log(`已处理 ${i}/${limit} 页`);
        }
      } catch (error) {
        console.error(`处理第 ${i} 页出错:`, error);
      }
    }
    
    return this.formatNovelContent(text);
  }

  /**
   * 提取章节
   */
  private async extractChapters(pdfDoc: any): Promise<any[]> {
    try {
      const numPages = pdfDoc.numPages;
      const chapters: any[] = [];
      
      // 章节检测正则
      const chapterPatterns = [
        /^第\s*(\d+)\s*章/,
        /^(\d+)\s*[\.、]\s*/,
        /^Chapter\s+(\d+)/i
      ];
      
      // 先扫描检测章节开始位置
      const potentialChapters = [];
      const pagesToScan = Math.min(numPages, 50); // 限制扫描页数
      
      for (let i = 1; i <= pagesToScan; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const lines = content.items.map((item: any) => item.str.trim());
        
        // 检查每页的前几行
        for (let j = 0; j < Math.min(10, lines.length); j++) {
          const line = lines[j];
          
          for (const pattern of chapterPatterns) {
            if (pattern.test(line)) {
              potentialChapters.push({ title: line, page: i });
              break;
            }
          }
        }
      }
      
      console.log(`检测到 ${potentialChapters.length} 个可能的章节`);
      
      // 如果找不到章节，把整本书当作一个章节
      if (potentialChapters.length === 0) {
        const allText = await this.extractAllText(pdfDoc, 100); // 限制为前100页
        chapters.push({
          title: '全文内容',
          content: allText,
          startPage: 1,
          endPage: numPages
        });
        return chapters;
      }
      
      // 处理找到的章节
      for (let i = 0; i < potentialChapters.length; i++) {
        const current = potentialChapters[i];
        const next = i < potentialChapters.length - 1 ? potentialChapters[i + 1] : null;
        
        const startPage = current.page;
        const endPage = next ? next.page - 1 : Math.min(numPages, startPage + 30);
        
        let chapterText = '';
        let firstPage = true;
        
        for (let p = startPage; p <= endPage; p++) {
          const page = await pdfDoc.getPage(p);
          const content = await page.getTextContent();
          let pageText = content.items.map((item: any) => item.str).join(' ');
          
          // 在第一页去除章节标题
          if (firstPage) {
            pageText = pageText.replace(current.title, '');
            firstPage = false;
          }
          
          chapterText += pageText + ' ';
        }
        
        chapters.push({
          title: current.title,
          content: this.formatNovelContent(chapterText),
          startPage,
          endPage
        });
      }
      
      return chapters;
    } catch (error) {
      console.error('章节提取失败:', error);
      throw error;
    }
  }

  /**
   * 格式化小说内容
   */
  private formatNovelContent(text: string): string {
    // 移除多余空格
    let formatted = text.replace(/\s+/g, ' ').trim();
    
    // 根据标点符号分段
    formatted = formatted.replace(/([。！？])\s*/g, '$1\n\n');
    
    // 如果没有足够的段落分隔，按照固定长度分段
    if (formatted.split('\n\n').length < 3) {
      const paragraphs = [];
      for (let i = 0; i < formatted.length; i += 200) {
        paragraphs.push(formatted.substring(i, Math.min(i + 200, formatted.length)));
      }
      formatted = paragraphs.join('\n\n');
    }
    
    return formatted;
  }

  /**
   * 从文件名提取书名
   */
  private extractBookTitle(fileName: string): string {
    // 移除文件扩展名和路径
    let title = fileName.split('/').pop() || fileName;
    title = title.replace(/\.[^/.]+$/, '');
    // 进一步处理文件名
    return title.replace(/_/g, ' ');
  }
}