/*
 * @Author: Diana Tang
 * @Date: 2025-03-12 19:46:13
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/services/r2.ts
 */
import { S3Client } from '@aws-sdk/client-s3';

// R2 configuration
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ''
  }
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'my-bucket';