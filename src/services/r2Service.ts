import { S3Client, ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand, } from '@aws-sdk/client-s3';
import * as pdfjsLib from 'pdfjs-dist';
import { Readable } from 'stream';

export class PdfNovelService {
  private r2Client: S3Client;
  private bucketName: string;

  constructor() {
    // 初始化R2客户端
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
   * 列出存储桶中的所有对象
   */
  async listBucketContents(prefix: string = '') {
    try {
      console.log(`尝试列出存储桶 ${this.bucketName} 中的内容，前缀: ${prefix || '(无)'}`);
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix
      });
      
      const response = await this.r2Client.send(command);
      console.log(`成功获取存储桶内容，找到 ${response.Contents?.length || 0} 个对象`);
      
      return {
        items: response.Contents?.map(item => ({
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified
        })) || [],
        count: response.KeyCount || 0
      };
    } catch (error) {
      console.error(`列出存储桶内容时出错:`, error);
      throw error;
    }
  }


  /**
   * 从R2获取PDF并转换为小说章节格式
   */
  async getPdfAsNovel(pdfFileName: string): Promise<any> {
    try {
      // 从R2获取PDF文件
      const pdfBuffer = await this.getPdfFromR2(pdfFileName);
      
      // 解析PDF内容
      const pdfDocument = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      
      // 提取章节
      const chapters = await this.extractChapters(pdfDocument);
      
      return {
        title: this.extractBookTitle(pdfFileName),
        totalChapters: chapters.length,
        chapters: chapters
      };
    } catch (error) {
      console.error(`处理PDF文件时出错: ${pdfFileName}`, error);
      throw error;
    }
  }

  /**
   * 获取指定章节内容
   */
  async getChapter(pdfFileName: string, chapterIndex: number): Promise<any> {
    try {
      // 从R2获取PDF文件
      const pdfBuffer = await this.getPdfFromR2(pdfFileName);
      
      // 解析PDF内容
      const pdfDocument = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      
      // 提取章节
      const chapters = await this.extractChapters(pdfDocument);
      
      if (chapterIndex < 0 || chapterIndex >= chapters.length) {
        throw new Error(`章节索引超出范围: ${chapterIndex}`);
      }
      
      return {
        title: this.extractBookTitle(pdfFileName),
        currentChapter: chapterIndex + 1,
        totalChapters: chapters.length,
        chapterTitle: chapters[chapterIndex].title,
        content: chapters[chapterIndex].content,
        nextChapter: chapterIndex < chapters.length - 1 ? chapterIndex + 1 : null,
        prevChapter: chapterIndex > 0 ? chapterIndex - 1 : null
      };
    } catch (error) {
      console.error(`获取章节内容时出错: ${pdfFileName}, 章节: ${chapterIndex}`, error);
      throw error;
    }
  }

  /**
   * 从R2获取PDF文件并转换为Buffer
   */
  private async getPdfFromR2(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      
      const response = await this.r2Client.send(command);
      
      if (!response.Body) {
        throw new Error('响应体为空');
      }
      
      const fileStream = response.Body as Readable;
      
      // 将流转换为Buffer
      const chunks: Buffer[] = [];
      for await (const chunk of fileStream) {
        chunks.push(Buffer.from(chunk));
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error(`从R2获取PDF时出错: ${key}`, error);
      throw error;
    }
  }

  /**
   * 从PDF中提取章节
   */
  private async extractChapters(pdfDocument: any): Promise<any[]> {
    const numPages = pdfDocument.numPages;
    const chapters: any[] = [];
    let currentChapter = { title: '第1章', content: '', startPage: 1 };
    
    // 章节检测的正则表达式
    const chapterRegex = /^第\s*(\d+)\s*[章節]|^Chapter\s*(\d+)/;
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      
      // 检查是否是新章节的开始
      const lines = pageText.split('\n');
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j].trim();
        const chapterMatch = line.match(chapterRegex);
        
        if (chapterMatch && j < 5) { // 假设章节标题在页面前5行
          if (currentChapter.content) {
            // 保存当前章节
            chapters.push({
              ...currentChapter,
              endPage: i - 1
            });
          }
          
          // 开始新章节
          const chapterNum = chapterMatch[1] || chapterMatch[2];
          currentChapter = {
            title: line,
            content: pageText.replace(line, '').trim(), // 移除章节标题
            startPage: i
          };
        } else {
          // 继续当前章节
          currentChapter.content += ' ' + pageText;
        }
      }
    }
    
    // 添加最后一章
    if (currentChapter.content) {
      chapters.push({
        ...currentChapter,
        endPage: numPages
      });
    }
    
    // 如果没有检测到任何章节，则整本书作为一章
    if (chapters.length === 0) {
      chapters.push({
        title: '全书内容',
        content: currentChapter.content,
        startPage: 1,
        endPage: numPages
      });
    }
    
    // 格式化内容
    return chapters.map(chapter => ({
      ...chapter,
      content: this.formatNovelContent(chapter.content)
    }));
  }

  /**
   * 将内容格式化为更友好的小说阅读格式
   */
  private formatNovelContent(content: string): string {
    // 移除多余的空格
    let formatted = content.replace(/\s+/g, ' ').trim();
    
    // 分段：两个句号之后的空格作为段落分隔
    formatted = formatted.replace(/。\s+/g, '。\n\n');
    
    // 确保合理的段落长度
    const paragraphs = formatted.split('\n\n');
    const formattedParagraphs = paragraphs.map(para => {
      // 大约每200个字符添加一个段落
      if (para.length > 300) {
        let newPara = '';
        for (let i = 0; i < para.length; i += 200) {
          // 寻找附近的句号作为分割点
          let splitPoint = para.indexOf('。', i + 150);
          if (splitPoint === -1 || splitPoint > i + 250) {
            splitPoint = i + 200;
          } else {
            splitPoint += 1; // 包含句号
          }
          newPara += para.substring(i, Math.min(splitPoint, para.length)) + '\n\n';
        }
        return newPara.trim();
      }
      return para;
    });
    
    return formattedParagraphs.join('\n\n');
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