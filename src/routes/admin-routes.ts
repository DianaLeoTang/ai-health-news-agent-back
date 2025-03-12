import express, { Request, Response, NextFunction } from 'express';
import { PdfService } from '../services/pdf-service';
import { PdfNovelService } from '../services/r2Service';

const router = express.Router();
const pdfService = new PdfService();
// 创建服务实例
const novelService = new PdfNovelService();

// 管理员路由 - 手动触发PDF处理
router.all('/process-pdf', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const { filePath } = req.body;
      
      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: '文件路径是必需的'
        });
      }
      
      // 调用PDF处理服务
      const result = await pdfService.processPdf(filePath);
      
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      console.error('处理PDF请求失败:', error);
      res.status(500).json({
        success: false,
        message: '处理PDF请求失败',
        error: (error as Error).message
      });
    }
  })();
});

// 管理员路由 - 批量处理PDF
router.all('/batch-process', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const { filePaths } = req.body;
      
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        return res.status(400).json({
          success: false,
          message: '文件路径数组是必需的'
        });
      }
      
      // 逐个处理文件并收集结果
      const results = [];
      let successCount = 0;
      let failCount = 0;
      
      for (const filePath of filePaths) {
        try {
          const result = await pdfService.processPdf(filePath);
          results.push(result);
          
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`处理文件失败: ${filePath}`, error);
          results.push({
            success: false,
            filePath,
            error: (error as Error).message
          });
          failCount++;
        }
      }
      
      res.status(200).json({
        success: true,
        totalFiles: filePaths.length,
        successCount,
        failCount,
        results
      });
    } catch (error) {
      console.error('批量处理PDF请求失败:', error);
      res.status(500).json({
        success: false,
        message: '批量处理PDF请求失败',
        error: (error as Error).message
      });
    }
  })();
});

// 管理员路由 - 列出所有PDF文件
router.get('/list-all-pdfs', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
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
  })();
});

export default router;