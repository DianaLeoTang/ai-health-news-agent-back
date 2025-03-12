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
  import { FileController } from '../services/fileController';
  
  const router = Router();
  const fileController = new FileController();
  
  // Routes
  router.get('/list', fileController.listFiles);
  router.get('/download/:fileKey', fileController.downloadFile);
  
  
  export default router;