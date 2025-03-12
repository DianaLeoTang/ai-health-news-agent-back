/*
 * @Author: Diana Tang
 * @Date: 2025-03-12 19:50:19
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/services/r2Service.ts
 */
import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from './r2';
import { Readable } from 'stream';

export class R2Service {
  /**
   * List all objects in a directory
   */
  async listObjects(prefix: string = '') {
    try {
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix
      });
      
      const response = await r2Client.send(command);
      return response.Contents || [];
    } catch (error) {
      console.error('Error listing objects from R2:', error);
      throw error;
    }
  }

  /**
   * Get a file from R2
   */
  async getObject(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key
      });
      
      const response = await r2Client.send(command);
      
      if (!response.Body) {
        throw new Error('Empty response body');
      }
      
      return response.Body as Readable;
    } catch (error) {
      console.error(`Error getting object ${key} from R2:`, error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getObjectMetadata(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key
      });
      
      const response = await r2Client.send(command);
      
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata
      };
    } catch (error) {
      console.error(`Error getting metadata for ${key}:`, error);
      throw error;
    }
  }
}
