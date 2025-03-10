
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { convertPdfToNovelFormat, saveNovelContent } from '../utils/pdfToNovel';
import NovelBook from '../models/NovelBook';

// 定义上传存储配置
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: Function) => {
    // 获取用户ID (假设用户认证信息在req.user中)
    const userId = (req as any).user?.id || 'anonymous';
    const userDir = path.join(__dirname, '../uploads/pdfs', userId);
    
    // 确保目录存在
    fs.ensureDirSync(userDir);
    cb(null, userDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    // 生成唯一文件名
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  // 只接受PDF文件
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('只接受PDF文件'), false);
  }
};

// 创建multer实例
export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
}).single('file');

// 处理文件上传的控制器函数
export const handleFileUpload = (req: Request, res: Response) => {
  upload(req, res, async (err: any) => {
    if (err) {
      // 处理上传错误
      if (err instanceof multer.MulterError) {
        // Multer错误 (例如文件过大)
        console.error('Multer错误:', err);
        return res.status(400).json({ 
          message: `文件上传失败: ${err.message}` 
        });
      } else {
        // 其他错误
        console.error('上传处理错误:', err);
        return res.status(400).json({ 
          message: `上传失败: ${err.message}` 
        });
      }
    }
    
    // 检查文件是否存在
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }

    try {
      // 从请求中获取文件信息
      const { originalname, mimetype, path: filePath='', size } = req.file;
      // 获取用户ID (考虑认证用户和匿名用户)
      const userId = (req as any).user?.id || 'anonymous';
      
      // 再次确认是PDF文件
      if (mimetype !== 'application/pdf') {
        await fs.unlink(filePath);
        return res.status(400).json({ message: '仅支持PDF文件' });
      }
      
      // 转换PDF为小说格式
      const novelContent = await convertPdfToNovelFormat(filePath);
      
      // 生成处理后的内容文件路径
      const contentFilename = `${uuidv4()}-novel.json`;
      const contentPath = path.join(
        __dirname, 
        `../uploads/novels/${userId}`, 
        contentFilename
      );
      
      // 确保输出目录存在
      fs.ensureDirSync(path.dirname(contentPath));
      
      // 保存处理后的内容
      await saveNovelContent(novelContent, contentPath);
      
      // 创建数据库记录 (假设已经设置了MongoDB连接)
      const novelBook = new NovelBook({
        title: novelContent.title,
        originalFilename: originalname,
        contentPath,
        originalFilePath: filePath,
        pageCount: novelContent.estimatedPages,
        chapterCount: novelContent.chapters.length,
        fileSize: size,
        userId
      });
      
      await novelBook.save();
      
      // 返回成功响应
      res.status(201).json({
        message: '文件转换成功',
        book: {
          id: novelBook._id,
          title: novelBook.title,
          pageCount: novelBook.pageCount,
          chapterCount: novelBook.chapterCount
        }
      });
      
    } catch (error: any) {
      console.error('文件处理错误:', error);
      
      // 如果上传了文件但处理失败，清理文件
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('删除文件失败:', unlinkError);
        }
      }
      
      res.status(500).json({ 
        message: '文件处理失败', 
        error: error.message 
      });
    }
  });
};