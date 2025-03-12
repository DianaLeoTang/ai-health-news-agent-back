import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
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

// 简单检查是否安装了pdfinfo
async function checkDependencies(): Promise<boolean> {
  try {
    await execPromise('pdfinfo -v', { timeout: 2000 });
    return true;
  } catch (error) {
    console.log('pdfinfo未安装或无法执行，将使用简化模式');
    return false;
  }
}

export class PdfService {
  private r2Client: S3Client;
  private bucketName: string;
  private dependenciesChecked: boolean = false;
  private dependenciesAvailable: boolean = false;

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
    
    // 异步检查依赖
    this.checkDependenciesAsync();
  }
  
  // 异步检查依赖
  private async checkDependenciesAsync() {
    this.dependenciesAvailable = await checkDependencies();
    this.dependenciesChecked = true;
    console.log(`PDF处理依赖检查完成: ${this.dependenciesAvailable ? '可用' : '不可用'}`);
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
   * 获取PDF页数（简单实现）
   */
  private async getPdfPageCount(pdfPath: string): Promise<number> {
    try {
      // 尝试使用pdfinfo
      if (this.dependenciesAvailable) {
        try {
          const { stdout } = await execPromise(`pdfinfo "${pdfPath}"`);
          const match = stdout.match(/Pages:\s+(\d+)/);
          if (match && match[1]) {
            return parseInt(match[1]);
          }
        } catch (error) {
          console.error('使用pdfinfo获取页数失败:', error);
        }
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
   * 获取小说信息
   */
  async getNovelInfo(filePath: string): Promise<any> {
    try {
      // 获取文件基本信息
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
        // 获取PDF页数
        const pageCount = await this.getPdfPageCount(downloadResult.tempFilePath);
        console.log(`PDF页数: ${pageCount}`);
        
        // 计算章节数 (每10页一章)
        const chaptersCount = Math.ceil(pageCount / 10);
        
        // 创建章节信息
        const chapters = [];
        for (let i = 0; i < chaptersCount; i++) {
          const startPage = i * 10 + 1;
          const endPage = Math.min((i + 1) * 10, pageCount);
          chapters.push({
            title: `第 ${i + 1} 章 (${startPage}-${endPage}页)`,
            startPage,
            endPage,
            contentPreview: `点击查看第 ${i + 1} 章内容...`
          });
        }
        
        return {
          success: true,
          data: {
            title: this.extractBookTitle(filePath),
            actualPath: fileInfo.data.actualPath,
            totalPages: pageCount,
            totalChapters: chaptersCount,
            fileSize: fileInfo.data.contentLength,
            contentType: fileInfo.data.contentType,
            chapters
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
        // 获取PDF页数
        const pageCount = await this.getPdfPageCount(downloadResult.tempFilePath);
        const chaptersCount = Math.ceil(pageCount / 10);
        
        if (chapterIndex < 0 || chapterIndex >= chaptersCount) {
          return {
            success: false,
            error: `章节索引超出范围: 0-${chaptersCount-1}`,
            totalChapters: chaptersCount
          };
        }
        
        // 计算章节页面范围
        const startPage = chapterIndex * 10 + 1;
        const endPage = Math.min((chapterIndex + 1) * 10, pageCount);
        
        // 生成章节内容
        // 注意：这里我们不再尝试使用ImageMagick和OCR，因为它们会导致超时
        // 而是返回模拟内容
        const paragraphs = [];
        paragraphs.push(`《${this.extractBookTitle(filePath)}》`);
        paragraphs.push(`章节 ${chapterIndex + 1}/${chaptersCount} (页码 ${startPage}-${endPage})`);
        paragraphs.push(`文件路径: ${fileInfo.data.actualPath}`);
        paragraphs.push(`文件大小: ${this.formatFileSize(fileInfo.data.contentLength)}`);
        paragraphs.push(`最后修改时间: ${fileInfo.data.lastModified.toLocaleString()}`);
        paragraphs.push(``);
        paragraphs.push(`由于Netlify Functions的30秒执行限制，无法执行完整的PDF到文本转换。`);
        paragraphs.push(`请考虑在本地环境或持久性服务器上处理PDF。`);
        
        // 添加一些随机段落，模拟真实内容
        for (let i = 0; i < 10; i++) {
          paragraphs.push(`这是第 ${chapterIndex + 1} 章的第 ${i + 1} 个段落。该章节包含从第 ${startPage} 页到第 ${endPage} 页的内容。由于执行环境限制，无法显示实际PDF内容。`);
        }
        
        return {
          success: true,
          data: {
            title: this.extractBookTitle(filePath),
            actualPath: fileInfo.data.actualPath,
            currentChapter: chapterIndex + 1,
            totalChapters: chaptersCount,
            chapterTitle: `第 ${chapterIndex + 1} 章 (${startPage}-${endPage}页)`,
            content: paragraphs.join('\n\n'),
            startPage,
            endPage,
            nextChapter: chapterIndex < chaptersCount - 1 ? chapterIndex + 1 : null,
            prevChapter: chapterIndex > 0 ? chapterIndex - 1 : null,
            note: "由于执行环境限制，返回的是模拟内容而非实际PDF文本"
          }
        };
      } finally {
        // 安全删除临时文件
        this.safelyDeleteFile(downloadResult.tempFilePath);
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