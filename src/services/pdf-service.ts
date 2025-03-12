import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import fs from 'fs';
import pathModule from 'path';

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
   * 获取小说信息 (简化版本)
   */
  async getNovelInfo(filePath: string): Promise<any> {
    try {
      // 直接返回简化信息，而不处理 PDF
      const fileResult = await this.getFileInfo(filePath);
      
      if (!fileResult.success) {
        return fileResult;
      }

      return {
        success: true,
        data: {
          title: this.extractBookTitle(filePath),
          actualPath: fileResult.data.actualPath,
          totalPages: "PDF解析暂时禁用",
          fileSize: fileResult.data.contentLength,
          contentType: fileResult.data.contentType,
          lastModified: fileResult.data.lastModified,
          // 返回一个简单的章节信息
          chapters: [
            {
              title: "全文内容",
              startPage: 1,
              endPage: -1,
              contentPreview: "PDF解析暂时禁用，稍后将提供章节内容..."
            }
          ]
        }
      };
    } catch (error) {
      console.error('获取小说信息失败:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * 获取章节内容 (简化版本)
   */
  async getChapterContent(filePath: string, chapterIndex: number): Promise<any> {
    try {
      const fileInfo = await this.getFileInfo(filePath);
      
      if (!fileInfo.success) {
        return fileInfo;
      }

      return {
        success: true,
        data: {
          title: this.extractBookTitle(filePath),
          actualPath: fileInfo.data.actualPath,
          currentChapter: 1,
          totalChapters: 1,
          chapterTitle: "全文内容",
          content: "PDF解析暂时禁用，稍后将提供章节内容...\n\n请稍后再试。",
          fileSize: fileInfo.data.contentLength,
          contentType: fileInfo.data.contentType,
          lastModified: fileInfo.data.lastModified,
          fileExists: true
        }
      };
    } catch (error) {
      console.error('获取章节内容失败:', error);
      return {
        success: false,
        error: (error as Error).message
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
}