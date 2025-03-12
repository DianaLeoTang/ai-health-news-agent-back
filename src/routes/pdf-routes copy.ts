/*
 * @Author: Diana Tang
 * @Date: 2025-03-12 15:33:04
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/routes/pdf-routes.ts
 */
// interface Env {
//     BUCKET: R2Bucket;
//   }
  
//   export const onRequest: PagesFunction<Env> = async (context) => {
//     const obj = await context.env.BUCKET.get("some-key");
//     if (obj === null) {
//       return new Response("Not found", { status: 404 });
//     }
//     return new Response(obj.body);
//   };


import express,{Router,Request, Response, NextFunction} from 'express';
import { PdfNovelService } from '../services/r2Service';
import { S3Client, ListBucketsCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand, } from '@aws-sdk/client-s3';
  import * as pdfjsLib from 'pdfjs-dist';
  import { Readable } from 'stream';

const router = Router();

// // 获取小说目录信息
// router.get('/book/:fileName', (req, res, next) => {
//   (async () => {
//     try {
//       const fileName = req.params.fileName;
//       const novelService = new PdfNovelService();
//       const bookInfo = await novelService.getPdfAsNovel(fileName);
      
//       res.status(200).json({
//         success: true,
//         data: bookInfo
//       });
//     } catch (error) {
//       console.error('获取小说信息时出错:', error);
//       if (!res.headersSent) {
//         res.status(500).json({
//           success: false,
//           message: '获取小说信息失败',
//           error: (error as Error).message
//         });
//       }
//     }
//   })();
// });


// 创建服务实例
const novelService = new PdfNovelService();

// 添加测试端点
router.get('/test-r2', async (req, res) => {
  try {
    console.log('收到R2测试请求');
    const bucketContents = await novelService.listBucketContents();
    
    res.status(200).json({
      success: true,
      message: 'R2连接测试成功',
      data: bucketContents
    });
  } catch (error) {
    console.error('R2测试端点出错:', error);
    res.status(500).json({
      success: false,
      message: 'R2连接测试失败',
      error: (error as Error).message
    });
  }
});
// 创建R2客户端函数
function createR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ''
    }
  });
}

// PDF信息获取路由
router.get('/pdf-info/:filePath(*)', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const filePath = req.params.filePath;
      console.log(`接收到PDF信息请求: ${req.path}, 文件路径: ${filePath}`);
      
      // 创建R2客户端
      const r2Client = createR2Client();
      
      const bucketName = process.env.R2_BUCKET_NAME || 'publichealthassets';
      
      // 尝试同时获取根目录和books目录下的文件
      const possiblePaths = [
        filePath,                   // 直接使用提供的路径
        `books/${filePath}`,        // books目录下
        filePath.replace('books/', '') // 如果已经包含了books/前缀，也尝试根目录
      ];
      
      let fileFound = false;
      let fileInfo: {
        contentType?: string;
        contentLength?: number;
        lastModified?: Date;
        metadata?: Record<string, string>;
        previewSize?: number;
      } = {};
      let usedPath = '';
      
      for (const path of possiblePaths) {
        try {
          console.log(`尝试获取路径: ${path}`);
          const headCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: path
          });
          
          const response = await r2Client.send(headCommand);
          
          // 如果成功，设置文件信息并跳出循环
          fileFound = true;
          usedPath = path;
          fileInfo = {
            contentType: response.ContentType,
            contentLength: response.ContentLength,
            lastModified: response.LastModified,
            metadata: response.Metadata
          };
          
          // 读取文件预览
          const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: path
          });
          
          const getResponse = await r2Client.send(getCommand);
          const fileStream = getResponse.Body as Readable;
          
          // 只读取前100KB
          const chunks: Buffer[] = [];
          let bytesRead = 0;
          const maxBytes = 100 * 1024;
          
          for await (const chunk of fileStream) {
            chunks.push(Buffer.from(chunk));
            bytesRead += chunk.length;
            if (bytesRead >= maxBytes) break;
          }
          
          const filePreview = Buffer.concat(chunks);
          fileInfo.previewSize = filePreview.length;
          
          console.log(`成功获取文件: ${path}, 大小: ${fileInfo.contentLength}`);
          break;
        } catch (error) {
          console.log(`路径 ${path} 获取失败: ${(error as Error).message}`);
        }
      }
      
      if (!fileFound) {
        return res.status(404).json({
          success: false,
          message: '文件未找到',
          error: '在任何可能的路径中都未找到该文件',
          triedPaths: possiblePaths
        });
      }
      
      // 返回文件信息
      res.status(200).json({
        success: true,
        message: '文件获取成功',
        data: {
          fileName: req.params.filePath,
          actualPath: usedPath,
          ...fileInfo,
          fileExists: true
        }
      });
    } catch (error) {
      console.error('获取PDF信息时出错:', error);
      res.status(500).json({
        success: false,
        message: '获取PDF信息失败',
        error: (error as Error).message,
        stack: (error as Error).stack
      });
    }
  })();
});

// 小说信息获取路由
router.get('/novel/book/:filePath(*)', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const filePath = req.params.filePath;
      console.log(`接收到小说请求: ${req.path}, 文件路径: ${filePath}`);
      
      // 创建R2客户端
      const r2Client = createR2Client();
      
      const bucketName = process.env.R2_BUCKET_NAME || 'publichealthassets';
      
      // 尝试不同的可能路径
      const possiblePaths = [
        filePath,                   // 直接使用提供的路径
        `books/${filePath}`,        // books目录下
        filePath.replace('books/', '') // 如果已经包含了books/前缀，也尝试根目录
      ];
      
      let fileFound = false;
      let pdfBuffer: Buffer | null = null;
      let usedPath = '';
      
      for (const path of possiblePaths) {
        try {
          console.log(`尝试获取路径: ${path}`);
          const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: path
          });
          
          const response = await r2Client.send(getCommand);
          const fileStream = response.Body as Readable;
          
          // 将流转换为Buffer
          const chunks: Buffer[] = [];
          for await (const chunk of fileStream) {
            chunks.push(Buffer.from(chunk));
          }
          
          pdfBuffer = Buffer.concat(chunks);
          fileFound = true;
          usedPath = path;
          console.log(`成功获取文件: ${path}, 大小: ${pdfBuffer.length} 字节`);
          break;
        } catch (error) {
          console.log(`路径 ${path} 获取失败: ${(error as Error).message}`);
        }
      }
      
      if (!fileFound || !pdfBuffer) {
        return res.status(404).json({
          success: false,
          message: '文件未找到',
          error: '在任何可能的路径中都未找到该文件',
          triedPaths: possiblePaths
        });
      }
      
      // 使用PDF.js解析PDF文件
      console.log('开始解析PDF内容...');
      const pdfDocument = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      const numPages = pdfDocument.numPages;
      console.log(`PDF总页数: ${numPages}`);
      
      // 提取章节
      console.log('开始提取章节信息...');
      const chapters = await extractChapters(pdfDocument);
      console.log(`提取到 ${chapters.length} 个章节`);
      
      // 返回处理结果
      res.status(200).json({
        success: true,
        message: '小说信息获取成功',
        data: {
          title: extractBookTitle(filePath),
          actualPath: usedPath,
          totalPages: numPages,
          totalChapters: chapters.length,
          chapters: chapters.map(ch => ({
            title: ch.title,
            startPage: ch.startPage,
            endPage: ch.endPage,
            // 不返回完整内容，只返回预览
            contentPreview: ch.content.substring(0, 200) + '...'
          }))
        }
      });
    } catch (error) {
      console.error('处理小说请求时出错:', error);
      res.status(500).json({
        success: false,
        message: '处理小说请求失败',
        error: (error as Error).message,
        stack: (error as Error).stack
      });
    }
  })();
});

// 获取章节内容路由
router.get('/novel/book/:filePath(*)/chapter/:chapterIndex', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const filePath = req.params.filePath;
      const chapterIndex = parseInt(req.params.chapterIndex);
      
      if (isNaN(chapterIndex)) {
        return res.status(400).json({
          success: false,
          message: '章节索引必须是数字'
        });
      }
      
      console.log(`接收到章节请求: ${req.path}, 文件: ${filePath}, 章节: ${chapterIndex}`);
      
      // 创建R2客户端
      const r2Client = createR2Client();
      
      const bucketName = process.env.R2_BUCKET_NAME || 'publichealthassets';
      
      // 尝试不同的可能路径
      const possiblePaths = [
        filePath,                   // 直接使用提供的路径
        `books/${filePath}`,        // books目录下
        filePath.replace('books/', '') // 如果已经包含了books/前缀，也尝试根目录
      ];
      
      let fileFound = false;
      let pdfBuffer: Buffer | null = null;
      let usedPath = '';
      
      for (const path of possiblePaths) {
        try {
          console.log(`尝试获取路径: ${path}`);
          const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: path
          });
          
          const response = await r2Client.send(getCommand);
          const fileStream = response.Body as Readable;
          
          // 将流转换为Buffer
          const chunks: Buffer[] = [];
          for await (const chunk of fileStream) {
            chunks.push(Buffer.from(chunk));
          }
          
          pdfBuffer = Buffer.concat(chunks);
          fileFound = true;
          usedPath = path;
          console.log(`成功获取文件: ${path}, 大小: ${pdfBuffer.length} 字节`);
          break;
        } catch (error) {
          console.log(`路径 ${path} 获取失败: ${(error as Error).message}`);
        }
      }
      
      if (!fileFound || !pdfBuffer) {
        return res.status(404).json({
          success: false,
          message: '文件未找到',
          error: '在任何可能的路径中都未找到该文件',
          triedPaths: possiblePaths
        });
      }
      
      // 使用PDF.js解析PDF文件
      console.log('开始解析PDF内容...');
      const pdfDocument = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
      const numPages = pdfDocument.numPages;
      
      // 提取章节
      console.log('开始提取章节信息...');
      const chapters = await extractChapters(pdfDocument);
      
      if (chapterIndex < 0 || chapterIndex >= chapters.length) {
        return res.status(404).json({
          success: false,
          message: '章节不存在',
          error: `章节索引超出范围，总章节数: ${chapters.length}`
        });
      }
      
      const chapter = chapters[chapterIndex];
      
      // 返回章节内容
      res.status(200).json({
        success: true,
        message: '章节内容获取成功',
        data: {
          title: extractBookTitle(filePath),
          actualPath: usedPath,
          currentChapter: chapterIndex + 1,
          totalChapters: chapters.length,
          chapterTitle: chapter.title,
          content: chapter.content,
          startPage: chapter.startPage,
          endPage: chapter.endPage,
          nextChapter: chapterIndex < chapters.length - 1 ? chapterIndex + 1 : null,
          prevChapter: chapterIndex > 0 ? chapterIndex - 1 : null
        }
      });
    } catch (error) {
      console.error('获取章节内容时出错:', error);
      res.status(500).json({
        success: false,
        message: '获取章节内容失败',
        error: (error as Error).message,
        stack: (error as Error).stack
      });
    }
  })();
});

// 提取章节函数
async function extractChapters(pdfDocument: any): Promise<any[]> {
  try {
    console.log('开始提取章节，总页数:', pdfDocument.numPages);
    const numPages = pdfDocument.numPages;
    const chapters: any[] = [];
    
    // 更强大的章节检测正则表达式
    const chapterRegexes = [
      /^第\s*(\d+)\s*[章節](?:\s+|[:：])(.*)/i,  // 中文章节格式：第X章：标题
      /^第\s*(\d+)\s*[章節]/i,                   // 简单中文章节：第X章
      /^Chapter\s*(\d+)(?:\s+|[:：])(.*)/i,      // 英文章节格式：Chapter X: Title
      /^Chapter\s*(\d+)/i,                       // 简单英文章节：Chapter X
      /^(\d+)[\.、]\s*(.*)/                      // 数字编号章节：1. 标题
    ];
    
    // 首先扫描文档识别章节标题
    const potentialChapters = [];
    
    console.log('第一阶段：扫描识别章节位置');
    const pagesToScan = Math.min(numPages, 100); // 限制扫描页数
    for (let i = 1; i <= pagesToScan; i++) {
      try {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const lines = textContent.items
          .map((item: any) => item.str.trim())
          .filter((line: string) => line.length > 0);
        
        for (let j = 0; j < Math.min(lines.length, 10); j++) { // 只检查每页前10行
          const line = lines[j];
          for (const regex of chapterRegexes) {
            if (regex.test(line)) {
              potentialChapters.push({
                title: line,
                page: i
              });
              break;
            }
          }
        }
      } catch (err) {
        console.error(`扫描页面 ${i} 时出错:`, err);
        // 继续下一页
      }
    }
    
    console.log(`识别到 ${potentialChapters.length} 个可能的章节`);
    
    // 如果没有识别到章节或只有一个章节，将整本书作为一章
    if (potentialChapters.length <= 1) {
      console.log('未识别到多个章节，将整本书作为一章处理');
      
      // 收集所有页面文本
      let fullText = '';
      const maxPages = Math.min(numPages, 100); // 限制处理页数，避免超时
      
      for (let i = 1; i <= maxPages; i++) {
        try {
          const page = await pdfDocument.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + ' ';
          
          // 定期更新进度
          if (i % 10 === 0) {
            console.log(`已处理 ${i}/${maxPages} 页`);
          }
        } catch (err) {
          console.error(`处理页面 ${i} 文本时出错:`, err);
          // 继续下一页
        }
      }
      
      chapters.push({
        title: potentialChapters.length === 1 ? potentialChapters[0].title : '全书内容',
        content: formatNovelContent(fullText),
        startPage: 1,
        endPage: maxPages
      });
      
      return chapters;
    }
    
    // 处理多章节情况
    console.log('第二阶段：提取各章节内容');
    for (let i = 0; i < potentialChapters.length; i++) {
      const current = potentialChapters[i];
      const next = i < potentialChapters.length - 1 ? potentialChapters[i + 1] : null;
      
      const startPage = current.page;
      const endPage = next ? next.page - 1 : Math.min(numPages, startPage + 30); // 限制单章最多30页
      
      console.log(`处理章节 ${i+1}/${potentialChapters.length}: 页码 ${startPage} 到 ${endPage}`);
      
      let chapterContent = '';
      let isFirstPage = true;
      
      for (let page = startPage; page <= endPage; page++) {
        try {
          const pdfPage = await pdfDocument.getPage(page);
          const textContent = await pdfPage.getTextContent();
          let pageText = textContent.items.map((item: any) => item.str).join(' ');
          
          // 第一页需要移除章节标题
          if (isFirstPage) {
            pageText = pageText.replace(current.title, '').trim();
            isFirstPage = false;
          }
          
          chapterContent += pageText + ' ';
        } catch (err) {
          console.error(`处理章节 ${i+1} 页面 ${page} 时出错:`, err);
          // 继续下一页
        }
      }
      
      chapters.push({
        title: current.title,
        content: formatNovelContent(chapterContent),
        startPage,
        endPage
      });
    }
    
    console.log(`完成章节提取，共 ${chapters.length} 章`);
    return chapters;
  } catch (error) {
    console.error('章节提取过程中发生错误:', error);
    throw error;
  }
}

// 格式化内容为小说阅读格式
function formatNovelContent(content: string): string {
  try {
    // 移除多余的空格和特殊字符
    let formatted = content.replace(/\s+/g, ' ')
                           .replace(/\u0000/g, '') // 移除NULL字符
                           .trim();
    
    // 识别段落：句号、问号、感叹号后跟空格作为段落分隔点
    formatted = formatted.replace(/([。？！])\s+/g, '$1\n\n');
    
    // 处理没有正确分段的情况
    if (formatted.indexOf('\n\n') === -1) {
      // 如果没有找到段落分隔，使用固定长度分段
      const paragraphs = [];
      for (let i = 0; i < formatted.length; i += 200) {
        paragraphs.push(formatted.substring(i, Math.min(i + 200, formatted.length)));
      }
      formatted = paragraphs.join('\n\n');
    }
    
    // 处理超长段落
    const paragraphs = formatted.split('\n\n');
    const formattedParagraphs = paragraphs.map(para => {
      // 大约每300个字符添加一个段落
      if (para.length > 300) {
        const newParas = [];
        for (let i = 0; i < para.length; i += 250) {
          // 寻找合适的分割点
          let endPoint = i + 250;
          if (endPoint < para.length) {
            const nextPeriod = para.indexOf('。', endPoint - 50);
            if (nextPeriod !== -1 && nextPeriod < endPoint + 50) {
              endPoint = nextPeriod + 1;
            }
          }
          
          newParas.push(para.substring(i, Math.min(endPoint, para.length)));
        }
        return newParas.join('\n\n');
      }
      return para;
    });
    
    return formattedParagraphs.join('\n\n');
  } catch (error) {
    console.error('格式化内容时出错:', error);
    return content; // 发生错误时返回原始内容
  }
}

// 从文件名提取书名
function extractBookTitle(fileName: string): string {
  // 移除文件扩展名和路径
  let title = fileName.split('/').pop() || fileName;
  title = title.replace(/\.[^/.]+$/, '');
  // 进一步处理文件名
  return title.replace(/_/g, ' ');
}

export default router;