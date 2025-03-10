// src/controllers/novelController.ts
import { Request, Response } from 'express';
import fs from 'fs-extra';
import path from 'path';
import { convertPdfToNovelFormat, saveNovelContent } from '../utils/pdfToNovel';
import NovelBook from '../models/NovelBook';
import { v4 as uuidv4 } from 'uuid'; // 使用正规的uuid库

// 自定义请求接口，仅包含文件属性，不含用户信息
interface FileRequest extends Request {
  file?: Express.Multer.File;
}

// 处理PDF上传并转换为小说格式
export const uploadPdf = async (req: FileRequest, res: Response): Promise<void> => {
  try {
    console.log(req,'这都什么参数')
    if (!req.file) {
      res.status(400).json({ message: '没有上传文件' });
      return;
    }

    const { originalname, mimetype, path: filePath='', size } = req.file;
    
    // 确保是PDF文件
    if (mimetype !== 'application/pdf') {
      await fs.unlink(filePath);
      res.status(400).json({ message: '仅支持PDF文件' });
      return;
    }
    
    // 转换PDF为小说格式
    const novelContent = await convertPdfToNovelFormat(filePath);
    
    // 生成处理后的内容文件路径
    const contentFilename = `${uuidv4()}-novel.json`;
    const contentPath = path.join(
      __dirname, 
      '../uploads/novels', 
      contentFilename
    );
    
    // 确保目录存在
    await fs.ensureDir(path.dirname(contentPath));
    
    // 保存处理后的内容
    await saveNovelContent(novelContent, contentPath);
    
    // 创建数据库记录
    const novelBook = new NovelBook({
      title: novelContent.title,
      originalFilename: originalname,
      contentPath,
      originalFilePath: filePath,
      pageCount: novelContent.estimatedPages,
      chapterCount: novelContent.chapters.length,
      fileSize: size
      // 不再包含userId字段
    });
    
    await novelBook.save();
    
    res.status(201).json({
      message: '文件转换成功',
      book: {
        id: novelBook._id,
        title: novelBook.title,
        pageCount: novelBook.pageCount,
        chapterCount: novelBook.chapterCount
      }
    });
    
  } catch (error) {
    console.error('PDF处理错误:', error);
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path); // 清理文件
      } catch (unlinkError) {
        console.error('删除文件失败:', unlinkError);
      }
    }
    res.status(500).json({ 
      message: '文件处理失败', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

// 获取小说内容
export const getNovelContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookId = req.params.id;
    
    // 无需检查用户ID
    const book = await NovelBook.findById(bookId);
    if (!book) {
      res.status(404).json({ message: '书籍不存在' });
      return;
    }
    
    // 读取处理后的内容
    const contentData = await fs.readJson(book.contentPath);
    
    // 更新最后阅读时间（可选）
    book.lastAccessed = new Date();
    await book.save();
    
    res.json({
      id: book._id,
      title: book.title,
      chapters: contentData.chapters.map((chapter: any) => ({
        title: chapter.title,
        // 不返回完整内容，只返回章节信息
      })),
      pageCount: book.pageCount,
      chapterCount: book.chapterCount,
      lastReadPage: book.lastReadPage,
      lastReadChapter: book.lastReadChapter
    });
  } catch (error) {
    console.error('获取小说内容错误:', error);
    res.status(500).json({ 
      message: '获取内容失败', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

// 获取特定章节内容
export const getChapterContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, chapterIndex } = req.params;
    
    // 无需检查用户ID
    const book = await NovelBook.findById(id);
    if (!book) {
      res.status(404).json({ message: '书籍不存在' });
      return;
    }
    
    // 读取处理后的内容
    const contentData = await fs.readJson(book.contentPath);
    
    // 检查章节是否存在
    const chapterIdx = parseInt(chapterIndex);
    if (isNaN(chapterIdx) || chapterIdx < 0 || chapterIdx >= contentData.chapters.length) {
      res.status(404).json({ message: '章节不存在' });
      return;
    }
    
    const chapter = contentData.chapters[chapterIdx];
    
    // 更新最后阅读章节
    book.lastReadChapter = chapterIdx;
    await book.save();
    
    res.json({
      title: chapter.title,
      content: chapter.content,
      chapterIndex: chapterIdx,
      nextChapter: chapterIdx < contentData.chapters.length - 1 ? chapterIdx + 1 : null,
      prevChapter: chapterIdx > 0 ? chapterIdx - 1 : null
    });
  } catch (error) {
    console.error('获取章节内容错误:', error);
    res.status(500).json({ 
      message: '获取章节内容失败', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};

// 更新阅读进度
export const updateReadingProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { progress, chapter, page } = req.body;
    
    // 无需检查用户ID
    const book = await NovelBook.findById(id);
    if (!book) {
      res.status(404).json({ message: '书籍不存在' });
      return;
    }
    
    // 更新阅读进度
    if (typeof progress === 'number') {
      book.readingProgress = progress;
    }
    
    if (typeof chapter === 'number') {
      book.lastReadChapter = chapter;
    }
    
    if (typeof page === 'number') {
      book.lastReadPage = page;
    }
    
    book.lastAccessed = new Date();
    await book.save();
    
    res.json({ 
      message: '阅读进度已更新',
      progress: book.readingProgress,
      chapter: book.lastReadChapter,
      page: book.lastReadPage
    });
  } catch (error) {
    console.error('更新阅读进度错误:', error);
    res.status(500).json({ 
      message: '更新阅读进度失败', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};