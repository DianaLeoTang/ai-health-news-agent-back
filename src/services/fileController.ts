/*
 * @Author: Diana Tang
 * @Date: 2025-03-12 19:51:53
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/services/fileController.ts
 */
import { Request, Response } from 'express';
import { R2Service } from './r2Service';
import { Readable } from 'stream';

export class FileController {
  private r2Service: R2Service;
  
  constructor() {
    this.r2Service = new R2Service();
  }
  
  /**
   * List files in a directory
   */
  listFiles = async (req: Request, res: Response) => {
    try {
      const prefix = req.query.prefix as string || '';
      const files = await this.r2Service.listObjects(prefix);
      
      res.status(200).json({
        success: true,
        data: files.map(file => ({
          key: file.Key,
          size: file.Size,
          lastModified: file.LastModified
        }))
      });
    } catch (error) {
      console.error('Error in listFiles controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list files',
        error: (error as Error).message
      });
    }
  };
  
  /**
   * Download a file
   */
  downloadFile = async (req: Request, res: Response) => {
   (async ()=>{
    try {
      const fileKey = req.params.fileKey;
      
      if (!fileKey) {
        return res.status(400).json({
          success: false,
          message: 'File key is required'
        });
      }
      
      // Get file metadata first
      const metadata = await this.r2Service.getObjectMetadata(fileKey);
      
      // Set appropriate headers
      if (metadata.contentType) {
        res.setHeader('Content-Type', metadata.contentType);
      }
      
      if (metadata.contentLength) {
        res.setHeader('Content-Length', metadata.contentLength.toString());
      }
      
      // Get and stream the file
      const fileStream = await this.r2Service.getObject(fileKey);
      
      // Handle streaming
      (fileStream as Readable).pipe(res);
    } catch (error) {
      console.error('Error in downloadFile controller:', error);
      
      // Check if headers have already been sent
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to download file',
          error: (error as Error).message
        });
      }
    }
}) ()
  }
}
