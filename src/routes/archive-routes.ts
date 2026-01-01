/*
 * @Author: Diana Tang
 * @Date: 2025-03-05
 * @LastEditors: Diana Tang
 * @Description: 存档相关路由 - 提供历史数据查询API
 * @FilePath: /AI-Health-News-Agent-Back/src/routes/archive-routes.ts
 */
import { Router, Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';

const router = Router();

// 数据目录
const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * 获取所有归档日期列表
 * GET /api/archives/dates
 */
router.get('/api/archives/dates', async (req: Request, res: Response) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    
    // 过滤出日期格式的目录 (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const dates = [];
    
    for (const file of files) {
      if (datePattern.test(file)) {
        const filePath = path.join(DATA_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          // 读取该日期的summary.json获取统计信息
          try {
            const summaryPath = path.join(filePath, 'summary.json');
            const summaryData = await fs.readFile(summaryPath, 'utf-8');
            const summary = JSON.parse(summaryData);
            
            dates.push({
              date: file,
              total: summary.length,
              successful: summary.filter((s: any) => s.status === 'success').length,
              failed: summary.filter((s: any) => s.status === 'error').length,
              created: stats.birthtime,
              modified: stats.mtime
            });
          } catch (error) {
            // 如果没有summary.json，只返回基本信息
            dates.push({
              date: file,
              created: stats.birthtime,
              modified: stats.mtime
            });
          }
        }
      }
    }
    
    // 按日期降序排序（最新的在前）
    dates.sort((a, b) => b.date.localeCompare(a.date));
    
    res.json({
      success: true,
      count: dates.length,
      dates
    });
  } catch (error) {
    console.error('获取归档日期列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取归档日期列表失败'
    });
  }
});

/**
 * 获取指定日期的汇总数据
 * GET /api/archives/:date/summary
 */
router.get('/api/archives/:date/summary', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    // 验证日期格式
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      res.status(400).json({
        success: false,
        error: '日期格式错误，应为 YYYY-MM-DD'
      });
      return;
    }
    
    const summaryPath = path.join(DATA_DIR, date, 'summary.json');
    const summaryData = await fs.readFile(summaryPath, 'utf-8');
    const summary = JSON.parse(summaryData);
    
    res.json({
      success: true,
      date,
      data: summary
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      res.status(404).json({
        success: false,
        error: '未找到该日期的归档数据'
      });
    } else {
      console.error('获取归档汇总数据失败:', error);
      res.status(500).json({
        success: false,
        error: '获取归档数据失败'
      });
    }
  }
});

/**
 * 获取指定日期的详细数据
 * GET /api/archives/:date/details/:filename
 */
router.get('/api/archives/:date/details/:filename', async (req: Request, res: Response) => {
  try {
    const { date, filename } = req.params;
    
    // 验证日期格式
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      res.status(400).json({
        success: false,
        error: '日期格式错误，应为 YYYY-MM-DD'
      });
      return;
    }
    
    // 安全检查：防止路径遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      res.status(400).json({
        success: false,
        error: '文件名格式错误'
      });
      return;
    }
    
    const filePath = path.join(DATA_DIR, date, filename);
    const fileData = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileData);
    
    res.json({
      success: true,
      date,
      filename,
      data
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      res.status(404).json({
        success: false,
        error: '未找到该文件'
      });
    } else {
      console.error('获取归档详细数据失败:', error);
      res.status(500).json({
        success: false,
        error: '获取归档数据失败'
      });
    }
  }
});

/**
 * 获取最新数据
 * GET /api/archives/latest
 */
router.get('/api/archives/latest', async (req: Request, res: Response) => {
  try {
    const latestPath = path.join(DATA_DIR, 'latest.json');
    const latestData = await fs.readFile(latestPath, 'utf-8');
    const data = JSON.parse(latestData);
    
    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // 如果没有latest.json，尝试读取summary.json
      try {
        const summaryPath = path.join(DATA_DIR, 'summary.json');
        const summaryData = await fs.readFile(summaryPath, 'utf-8');
        const summary = JSON.parse(summaryData);
        
        res.json({
          success: true,
          data: {
            updated_at: new Date().toISOString(),
            results: summary
          }
        });
      } catch (err) {
        res.status(404).json({
          success: false,
          error: '未找到最新数据'
        });
      }
    } else {
      console.error('获取最新数据失败:', error);
      res.status(500).json({
        success: false,
        error: '获取最新数据失败'
      });
    }
  }
});

/**
 * 对比两个日期的数据
 * GET /api/archives/compare?date1=YYYY-MM-DD&date2=YYYY-MM-DD
 */
router.get('/api/archives/compare', async (req: Request, res: Response) => {
  try {
    const { date1, date2 } = req.query;
    
    if (!date1 || !date2) {
      res.status(400).json({
        success: false,
        error: '请提供两个日期参数'
      });
      return;
    }
    
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date1 as string) || !datePattern.test(date2 as string)) {
      res.status(400).json({
        success: false,
        error: '日期格式错误，应为 YYYY-MM-DD'
      });
      return;
    }
    
    // 读取两个日期的summary数据
    const summary1Path = path.join(DATA_DIR, date1 as string, 'summary.json');
    const summary2Path = path.join(DATA_DIR, date2 as string, 'summary.json');
    
    const [data1, data2] = await Promise.all([
      fs.readFile(summary1Path, 'utf-8').then(JSON.parse),
      fs.readFile(summary2Path, 'utf-8').then(JSON.parse)
    ]);
    
    res.json({
      success: true,
      comparison: {
        date1: {
          date: date1,
          total: data1.length,
          successful: data1.filter((s: any) => s.status === 'success').length
        },
        date2: {
          date: date2,
          total: data2.length,
          successful: data2.filter((s: any) => s.status === 'success').length
        }
      }
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      res.status(404).json({
        success: false,
        error: '未找到指定日期的归档数据'
      });
    } else {
      console.error('对比归档数据失败:', error);
      res.status(500).json({
        success: false,
        error: '对比数据失败'
      });
    }
  }
});

export default router;