// src/utils/pdfToNovel.ts
import fs from 'fs-extra';
import path from 'path';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';

// 定义类型
interface Chapter {
  title: string;
  content: string;
  startPosition: number;
  endPosition: number;
}

interface NovelContent {
  title: string;
  totalCharacters: number;
  estimatedPages: number;
  rawContent: string;
  chapters: Chapter[];
}

interface ChapterMarker {
  title: string;
  position: number;
}

/**
 * 将PDF转换为小说格式内容
 * @param filePath PDF文件路径
 * @returns 结构化的小说内容
 */
export async function convertPdfToNovelFormat(filePath: string): Promise<NovelContent> {
  try {
    // 读取PDF文件
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    // 提取文本内容
    let text = pdfData.text;
    
    // 处理文本，去除多余空格和格式问题
    text = text.replace(/\s+/g, ' ')            // 合并多个空格
             .replace(/\f/g, '\n\n')            // 将换页符转为段落分隔
             .replace(/([.!?])\s/g, '$1\n\n')   // 在句子结束后添加段落分隔
             .trim();
    
    // 尝试检测章节
    const chapters = detectChapters(text);
    
    // 获取标题（使用文件名或尝试从内容中提取）
    const title = path.basename(filePath, '.pdf').replace(/[-_]/g, ' ');
    
    // 构建结构化内容
    const novelContent: NovelContent = {
      title,
      totalCharacters: text.length,
      estimatedPages: Math.ceil(text.length / 2000), // 假设每页2000字符
      rawContent: text,
      chapters: chapters
    };
    
    return novelContent;
  } catch (error) {
    console.error('PDF转换失败:', error);
    throw new Error('无法将PDF转换为小说格式');
  }
}

/**
 * 检测文本中的章节
 * @param text 完整文本内容
 * @returns 章节数组
 */
function detectChapters(text: string): Chapter[] {
  // 常见的章节标记模式
  const chapterPatterns = [
    /第[0-9一二三四五六七八九十百千]+章\s*[^\n]+/g,   // 中文数字章节 "第一章 章节名"
    /第\s*[0-9]+\s*章\s*[^\n]+/g,                   // 阿拉伯数字章节 "第 1 章 章节名"
    /CHAPTER\s+[0-9IVX]+\s*[^\n]*/gi,              // 英文章节 "CHAPTER 1 名称"
    /SECTION\s+[0-9IVX]+\s*[^\n]*/gi,              // 英文节 "SECTION 1 名称"
    /PART\s+[0-9IVX]+\s*[^\n]*/gi,                 // 英文部分 "PART 1 名称"
  ];
  
  // 找出所有可能的章节标记及其位置
  let chapterMarkers: ChapterMarker[] = [];
  
  chapterPatterns.forEach(pattern => {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      chapterMarkers.push({
        title: match[0].trim(),
        position: match.index
      });
    }
  });
  
  // 按位置排序章节标记
  chapterMarkers.sort((a, b) => a.position - b.position);
  
  // 如果没有检测到章节，创建一个默认章节
  if (chapterMarkers.length === 0) {
    // 尝试寻找文档标题
    const firstLines = text.split('\n').slice(0, 5);
    const possibleTitle = firstLines[0].trim();
    
    return [{
      title: possibleTitle || '全文内容',
      content: text,
      startPosition: 0,
      endPosition: text.length
    }];
  }
  
  // 构建章节内容
  const chapters: Chapter[] = [];
  
  for (let i = 0; i < chapterMarkers.length; i++) {
    const current = chapterMarkers[i];
    const next = chapterMarkers[i + 1];
    
    const startPos = current.position;
    const endPos = next ? next.position : text.length;
    
    // 提取章节内容
    const chapterContent = text.substring(startPos, endPos).trim();
    
    chapters.push({
      title: current.title,
      content: chapterContent,
      startPosition: startPos,
      endPosition: endPos
    });
  }
  
  return chapters;
}

/**
 * 分割章节内容为页面
 * @param content 章节内容
 * @param charsPerPage 每页字符数
 * @returns 页面数组
 */
export function splitContentIntoPages(content: string, charsPerPage = 2000): string[] {
  const pages: string[] = [];
  let currentPosition = 0;
  
  while (currentPosition < content.length) {
    // 找到一个合适的分页点 (句子结束)
    let endPosition = Math.min(currentPosition + charsPerPage, content.length);
    
    // 如果没有到达内容末尾，尝试在句子结束处分页
    if (endPosition < content.length) {
      // 在当前位置之后找到最近的句子结束点 (., !, ?)
      const nextSentenceEnd = content.substring(currentPosition, currentPosition + charsPerPage * 1.2)
        .search(/[.!?]\s/);
      
      if (nextSentenceEnd !== -1) {
        endPosition = currentPosition + nextSentenceEnd + 2; // +2 包含标点和空格
      }
    }
    
    // 添加当前页
    pages.push(content.substring(currentPosition, endPosition));
    currentPosition = endPosition;
  }
  
  return pages;
}

/**
 * 保存处理后的内容为JSON文件
 * @param novelContent 小说内容对象
 * @param outputPath 输出路径
 * @returns 输出文件路径
 */
export async function saveNovelContent(novelContent: NovelContent, outputPath: string): Promise<string> {
  try {
    // 确保目录存在
    await fs.ensureDir(path.dirname(outputPath));
    
    // 保存内容
    await fs.writeJson(outputPath, novelContent, { spaces: 2 });
    
    return outputPath;
  } catch (error) {
    console.error('保存小说内容失败:', error);
    throw error;
  }
}