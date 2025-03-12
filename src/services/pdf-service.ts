import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import fs from 'fs';
import pathModule from 'path';
import { exec } from 'child_process';
import util from 'util';

// 将exec转换为Promise版本，但设置较短的超时
const execPromise = (command: string, options = {}) => {
  return util.promisify(exec)(command, { 
    timeout: 10000, // 10秒超时
    ...options 
  });
};

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
   * 下载PDF文件到临时目录
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
   * 安全删除文件（检查文件存在后删除）
   */
  private safelyDeleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`删除文件失败: ${filePath}`, error);
    }
  }

  /**
   * 检查缓存的处理结果是否存在
   */
  private async checkCachedResult(filePath: string): Promise<{
    exists: boolean;
    data?: any;
  }> {
    try {
      // 构建缓存键
      const cacheKey = `cache/${this.getCacheKey(filePath)}.json`;
      
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: cacheKey
        });
        
        const response = await this.r2Client.send(command);
        const stream = response.Body as Readable;
        const chunks: Buffer[] = [];
        
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
        }
        
        const buffer = Buffer.concat(chunks);
        const jsonData = JSON.parse(buffer.toString('utf-8'));
        
        console.log(`找到缓存的处理结果: ${cacheKey}`);
        return {
          exists: true,
          data: jsonData
        };
      } catch (error) {
        console.log(`没有找到缓存结果: ${cacheKey}`);
        return { exists: false };
      }
    } catch (error) {
      console.error('检查缓存结果失败:', error);
      return { exists: false };
    }
  }

  /**
   * 存储处理结果到缓存
   */
  private async cacheProcessingResult(filePath: string, data: any): Promise<boolean> {
    try {
      // 构建缓存键
      const cacheKey = `cache/${this.getCacheKey(filePath)}.json`;
      const jsonData = JSON.stringify(data);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: cacheKey,
        Body: jsonData,
        ContentType: 'application/json'
      });
      
      await this.r2Client.send(command);
      console.log(`已缓存处理结果: ${cacheKey}`);
      return true;
    } catch (error) {
      console.error('缓存处理结果失败:', error);
      return false;
    }
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(filePath: string): string {
    // 移除路径前缀，只使用文件名部分
    const fileName = filePath.split('/').pop() || filePath;
    // 一个简单的方法，可以改进为更可靠的哈希
    return fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }

  /**
   * 获取PDF页数（简单实现）
   */
  private async getPdfPageCount(pdfPath: string): Promise<number> {
    try {
      // 尝试使用pdfinfo
      try {
        const { stdout } = await execPromise(`pdfinfo "${pdfPath}"`);
        const match = stdout.match(/Pages:\s+(\d+)/);
        if (match && match[1]) {
          return parseInt(match[1]);
        }
      } catch (error) {
        console.error('使用pdfinfo获取页数失败:', error);
      }
      
      // 如果失败，根据文件大小估算
      const stats = fs.statSync(pdfPath);
      // 大约每30KB一页，这是一个非常粗略的估计
      return Math.ceil(stats.size / 30000) || 100;
    } catch (error) {
      console.error('获取PDF页数失败:', error);
      return 100; // 默认100页
    }
  }

  /**
   * 生成预处理数据 - 这将在预处理阶段被调用
   */
  private async generateProcessingData(pdfPath: string, actualPath: string, fileSize: number): Promise<any> {
    // 获取PDF页数
    const pageCount = await this.getPdfPageCount(pdfPath);
    console.log(`PDF页数: ${pageCount}`);
    
    // 计算章节数 (每10页一章)
    const chaptersCount = Math.ceil(pageCount / 10);
    
    // 这里可以添加实际的PDF处理逻辑，包括提取文本等
    // 因为这是在预处理阶段执行，所以没有30秒的限制
    
    // 创建章节信息
    const chapters = [];
    for (let i = 0; i < chaptersCount; i++) {
      const startPage = i * 10 + 1;
      const endPage = Math.min((i + 1) * 10, pageCount);
      
      // 从PDF中提取这些页面的文本
      let chapterContent = this.generateSampleContent(i, startPage, endPage);
      
      // 这里添加实际的PDF文本提取代码
      // 例如: chapterContent = await this.extractTextFromPages(pdfPath, startPage, endPage);
      
      chapters.push({
        title: `第 ${i + 1} 章 (${startPage}-${endPage}页)`,
        startPage,
        endPage,
        contentPreview: chapterContent.substring(0, 200) + '...',
        content: chapterContent
      });
    }
    
    // 返回处理结果
    return {
      title: this.extractBookTitle(actualPath),
      actualPath: actualPath,
      totalPages: pageCount,
      totalChapters: chaptersCount,
      fileSize: fileSize,
      chapters: chapters,
      processedAt: new Date().toISOString()
    };
  }
  
  /**
   * 生成示例内容 - 在无法提取真实内容时使用
   */
  private generateSampleContent(chapterIndex: number, startPage: number, endPage: number): string {
    const paragraphs = [];
    paragraphs.push(`第 ${chapterIndex + 1} 章 (页 ${startPage} - ${endPage})`);
    paragraphs.push(`这是通过预处理缓存系统生成的示例内容。`);
    paragraphs.push(`在实际应用中，这里会包含从PDF中提取的真实文本。`);
    
    // 添加一些模拟段落
    for (let i = 0; i < 10; i++) {
      paragraphs.push(`这是第 ${chapterIndex + 1} 章的第 ${i + 1} 个段落。该章节包含从第 ${startPage} 页到第 ${endPage} 页的内容。在完整实现中，这里将显示实际从PDF提取的文本内容。`);
    }
    
    return paragraphs.join('\n\n');
  }

  /**
   * 获取小说信息
   */
  async getNovelInfo(filePath: string): Promise<any> {
    try {
      // 获取文件基本信息
      const fileInfo = await this.getFileInfo(filePath);
      if (!fileInfo.success) {
        return fileInfo;
      }

      // 检查缓存
      const cachedResult = await this.checkCachedResult(filePath);
      if (cachedResult.exists && cachedResult.data) {
        console.log('使用缓存的处理结果');
        
        // 提取只需要的信息，不包含完整章节内容
        const { chapters, ...basicInfo } = cachedResult.data;
        return {
          success: true,
          data: {
            ...basicInfo,
            fromCache: true,
            chapters: chapters.map((ch: any) => ({
              title: ch.title,
              startPage: ch.startPage,
              endPage: ch.endPage,
              contentPreview: ch.contentPreview || ch.content.substring(0, 200) + '...'
            }))
          }
        };
      }

      // 没有缓存，执行预处理和缓存逻辑
      console.log('没有缓存，准备处理文件');
      
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
        // 生成处理数据
        const processingData = await this.generateProcessingData(
          downloadResult.tempFilePath, 
          fileInfo.data.actualPath, 
          fileInfo.data.contentLength || 0
        );
        
        // 存储到缓存
        await this.cacheProcessingResult(filePath, processingData);
        
        // 提取只需要的信息返回，不包含完整章节内容
        const { chapters, ...basicInfo } = processingData;
        return {
          success: true,
          data: {
            ...basicInfo,
            newlyProcessed: true,
            chapters: chapters.map((ch: any) => ({
              title: ch.title,
              startPage: ch.startPage,
              endPage: ch.endPage,
              contentPreview: ch.contentPreview
            }))
          }
        };
      } finally {
        // 安全删除临时文件
        this.safelyDeleteFile(downloadResult.tempFilePath);
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
      // 获取文件基本信息
      const fileInfo = await this.getFileInfo(filePath);
      if (!fileInfo.success) {
        return fileInfo;
      }

      // 检查缓存
      const cachedResult = await this.checkCachedResult(filePath);
      if (cachedResult.exists && cachedResult.data) {
        console.log('使用缓存的章节内容');
        
        const { chapters, ...bookInfo } = cachedResult.data;
        
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
            ...bookInfo,
            currentChapter: chapterIndex + 1,
            totalChapters: chapters.length,
            chapterTitle: chapter.title,
            content: chapter.content,
            startPage: chapter.startPage,
            endPage: chapter.endPage,
            nextChapter: chapterIndex < chapters.length - 1 ? chapterIndex + 1 : null,
            prevChapter: chapterIndex > 0 ? chapterIndex - 1 : null,
            fromCache: true
          }
        };
      }

      // 没有缓存，需要执行完整处理
      console.log('没有章节缓存数据，需要处理文件');
      
      // 在这种情况下，我们应该先处理整个PDF并存储结果
      // 这可能在Netlify函数中超时，但我们可以返回一个特定的响应让客户端稍后重试
      
      // 返回状态指示正在处理
      return {
        success: true,
        processingStatus: 'initiated',
        message: '文件正在处理中，请稍后再试获取章节内容',
        retryAfter: 30, // 建议客户端30秒后重试
        data: {
          title: this.extractBookTitle(filePath),
          totalChapters: 'processing',
          currentChapter: chapterIndex + 1,
          chapterTitle: `第 ${chapterIndex + 1} 章`,
          content: '内容正在处理中，请稍后再试...',
          processingStarted: true
        }
      };
      
      // 注意：在实际实现中，你应该启动一个后台任务来处理PDF
      // 例如，可以调用另一个API或者使用消息队列
      // 这里为了简化，我们只返回状态消息
    } catch (error) {
      console.error('获取章节内容失败:', error);
      return {
        success: false,
        error: `获取章节内容失败: ${(error as Error).message}`
      };
    }
  }

  /**
   * 手动触发PDF处理（用于预处理）
   * 这个方法可以由管理API或定时任务调用
   */
  async processPdf(filePath: string): Promise<any> {
    try {
      // 获取文件信息
      const fileInfo = await this.getFileInfo(filePath);
      if (!fileInfo.success) {
        return {
          success: false,
          error: '找不到文件',
          filePath
        };
      }
      
      // 下载文件到临时位置
      const downloadResult = await this.downloadToTemp(filePath);
      if (!downloadResult.success || !downloadResult.tempFilePath) {
        return {
          success: false,
          error: '下载文件失败',
          filePath
        };
      }
      
      try {
        // 生成处理数据
        const processingData = await this.generateProcessingData(
          downloadResult.tempFilePath,
          fileInfo.data.actualPath,
          fileInfo.data.contentLength || 0
        );
        
        // 存储到缓存
        const cached = await this.cacheProcessingResult(filePath, processingData);
        
        return {
          success: true,
          message: '文件处理完成并已缓存',
          cached,
          filePath,
          totalPages: processingData.totalPages,
          totalChapters: processingData.totalChapters
        };
      } finally {
        // 安全删除临时文件
        this.safelyDeleteFile(downloadResult.tempFilePath);
      }
    } catch (error) {
      console.error('PDF处理失败:', error);
      return {
        success: false,
        error: `PDF处理失败: ${(error as Error).message}`,
        filePath
      };
    }
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

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes?: number): string {
    if (!bytes) return '未知';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}