/*
 * @Author: Diana Tang
 * @Date: 2025-03-05
 * @LastEditors: Diana Tang
 * @Description: 用户认证相关路由
 * @FilePath: /AI-Health-News-Agent/apps/back-end/src/routes/auth-routes.ts
 */
import { Router, Request, Response } from 'express';
import { setAccess } from './user-routes';

const router = Router();

// 用于跟踪用户访问级别的变量(在实际应用中应使用会话/JWT)
// 已移至user-routes模块中，通过setAccess方法设置

// 登录接口
router.post("/login/account", async (req: Request, res: Response) => {
  // 获取查询参数中的token（如果存在）
  const token = req.query.token;
  
  // 从请求体中获取登录信息
  const { password, username, type } = req.body;
  
  // 可以根据需要验证token
  // if (token !== '123') {
  //   return res.status(401).json({
  //     status: 'error',
  //     message: '无效的token'
  //   });
  // }
  
  // 管理员登录
  if (password === 'ant.design' && username === 'admin') {
    setAccess('admin');
    return res.json({
      status: 'ok',
      type,
      currentAuthority: 'admin',
    });
  }
  
  // 普通用户登录
  if (password === 'ant.design' && username === 'user') {
    setAccess('user');
    return res.json({
      status: 'ok',
      type,
      currentAuthority: 'user',
    });
  }
  
  // 移动端登录
  if (type === 'mobile') {
    setAccess('admin');
    return res.json({
      status: 'ok',
      type,
      currentAuthority: 'admin',
    });
  }
  
  // 登录失败
  setAccess('guest');
  return res.json({
    status: 'error',
    type,
    currentAuthority: 'guest',
  });
});

// 获取当前用户访问级别 - 已移至user-routes模块中
// router.get("/api/currentUser", (req: Request, res: Response) => {
//   res.json({
//     access,
//   });
// });

export default router;