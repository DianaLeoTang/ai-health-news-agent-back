/*
 * @Author: Diana Tang
 * @Date: 2025-03-05
 * @LastEditors: Diana Tang
 * @Description: 用户认证相关路由
 * @FilePath: /AI-Health-News-Agent/apps/back-end/src/routes/auth-routes.ts
 */
import { Router, Request, Response } from 'express';

const router = Router();

// 用于跟踪用户访问级别的变量(在实际应用中应使用会话/JWT)
let access = 'guest';

// 登录接口
router.post("/login/account", async (req: Request, res: Response) => {
  const { password, username, type } = req.body;
  
  // 管理员登录
  if (password === 'ant.design' && username === 'admin') {
    access = 'admin';
    return res.json({
      status: 'ok',
      type,
      currentAuthority: 'admin',
    });
  }
  
  // 普通用户登录
  if (password === 'ant.design' && username === 'user') {
    access = 'user';
    return res.json({
      status: 'ok',
      type,
      currentAuthority: 'user',
    });
  }
  
  // 移动端登录
  if (type === 'mobile') {
    access = 'admin';
    return res.json({
      status: 'ok',
      type,
      currentAuthority: 'admin',
    });
  }
  
  // 登录失败
  access = 'guest';
  return res.json({
    status: 'error',
    type,
    currentAuthority: 'guest',
  });
});

// 获取当前用户访问级别
router.get("/currentUser", (req: Request, res: Response) => {
  res.json({
    access,
  });
});

export default router;