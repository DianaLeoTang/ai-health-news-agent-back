/*
 * @Author: Diana Tang
 * @Date: 2025-03-05 17:47:31
 * @LastEditors: Diana Tang
 * @Description: 用户认证路由
 * @FilePath: /AI-Health-News-Agent-Back/src/routes/auth-routes.ts
 */
import { Router, Request, Response, NextFunction } from 'express';
import { setAccess } from './user-routes';

const router = Router();

// 登录接口
router.post("/login/account", (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      // 获取查询参数中的token（如果存在）
      const token = req.query.token;
      
      // 从请求体中获取登录信息
      const { password, username, type } = req.body;
      
      // 管理员登录
      if (password === 'ant.design' && username === 'admin') {
        setAccess('admin');
        res.json({
          status: 'ok',
          type,
          currentAuthority: 'admin',
        });
        return;
      }
      
      // 普通用户登录
      if (password === 'ant.design' && username === 'user') {
        setAccess('user');
        res.json({
          status: 'ok',
          type,
          currentAuthority: 'user',
        });
        return;
      }
      
      // 移动端登录
      if (type === 'mobile') {
        setAccess('admin');
        res.json({
          status: 'ok',
          type,
          currentAuthority: 'admin',
        });
        return;
      }
      
      // 登录失败
      setAccess('guest');
      res.json({
        status: 'error',
        type,
        currentAuthority: 'guest',
      });
    } catch (error) {
      console.error('登录处理时出错:', error);
      res.status(500).json({
        status: 'error',
        message: '登录处理时发生内部错误'
      });
    }
  })();
});

/**
 * 用户登出接口
 * 对应前端mock: 'POST /api/login/outLogin': { data: {}, success: true }
 */
router.post('/login/outLogin', (req, res) => {
  // 在实际应用中，这里可能需要:
  // 1. 清除服务器端的用户session
  // 2. 使JWT token失效
  // 3. 记录用户登出日志等
  setAccess('')
  // 返回与前端mock一致的数据结构
  res.json({
    data: {},
    success: true
  });
});

export default router;