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


import express,{Router} from 'express';
import { PdfNovelService } from '../services/r2Service';

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

// // 获取章节内容
// router.get('/book/:fileName/chapter/:chapterIndex', (req, res, next) => {
//   (async () => {
//     try {
//       const fileName = req.params.fileName;
//       const chapterIndex = parseInt(req.params.chapterIndex);
      
//       if (isNaN(chapterIndex)) {
//         res.status(400).json({
//           success: false,
//           message: '章节索引必须是数字'
//         });
//         return;
//       }
      
//       const novelService = new PdfNovelService();
//       const chapterContent = await novelService.getChapter(fileName, chapterIndex);
      
//       res.status(200).json({
//         success: true,
//         data: chapterContent
//       });
//     } catch (error) {
//       console.error('获取章节内容时出错:', error);
//       if (!res.headersSent) {
//         res.status(500).json({
//           success: false,
//           message: '获取章节内容失败',
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

export default router;