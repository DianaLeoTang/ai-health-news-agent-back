/*
 * @Author: Diana Tang
 * @Date: 2025-03-12 15:33:04
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/routes/pdf-routes.ts
 */
import express, { Request, Response, NextFunction,Router } from 'express';
import { PdfService } from '../services/pdf-service';

const router = Router();
const pdfService = new PdfService();

// PDF信息获取路由
router.get('/pdf-info/:filePath(*)', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const filePath = req.params.filePath;
      console.log(`接收到PDF信息请求: ${req.path}, 文件路径: ${filePath}`);
      
      const result = await pdfService.getFileInfo(filePath);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
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
      
      const result = await pdfService.getNovelInfo(filePath);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
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
      
      const result = await pdfService.getChapterContent(filePath, chapterIndex);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
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

export default router;