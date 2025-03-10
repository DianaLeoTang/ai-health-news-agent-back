/*
 * @Author: Diana Tang
 * @Date: 2025-03-09 23:36:55
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/models/NovelBook.ts
 */
// src/models/NovelBook.ts
import mongoose, { Document, Schema } from 'mongoose';

// 定义NovelBook文档接口
export interface INovelBook extends Document {
  title: string;
  originalFilename: string;
  contentPath: string;
  originalFilePath: string;
  coverPath?: string;
  pageCount: number;
  chapterCount: number;
  fileSize: number;
  lastReadPage: number;
  lastReadChapter: number;
  readingProgress?: number;
  uploadDate: Date;
  lastAccessed?: Date;
  userId: mongoose.Types.ObjectId;
}

// 定义Schema
const NovelBookSchema: Schema = new Schema({
  title: { type: String, required: true },
  originalFilename: { type: String, required: true },
  contentPath: { type: String, required: true }, // 处理后的JSON路径
  originalFilePath: { type: String, required: true }, // 原始PDF路径
  coverPath: { type: String }, // 封面图片路径
  pageCount: { type: Number, default: 0 },
  chapterCount: { type: Number, default: 0 },
  fileSize: { type: Number, required: true },
  lastReadPage: { type: Number, default: 0 },
  lastReadChapter: { type: Number, default: 0 },
  readingProgress: { type: Number, default: 0 },
  uploadDate: { type: Date, default: Date.now },
  lastAccessed: { type: Date },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

// 创建和导出模型
export default mongoose.model<INovelBook>('NovelBook', NovelBookSchema);