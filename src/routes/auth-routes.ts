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

// 验证码存储（生产环境应使用Redis）
interface CaptchaStore {
  [key: string]: {
    code: string;
    phone: string;
    expiresAt: number;
  };
}

const captchaStore: CaptchaStore = {};

// 生成6位数验证码
function generateCaptcha(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 清理过期验证码
function cleanExpiredCaptchas() {
  const now = Date.now();
  Object.keys(captchaStore).forEach(key => {
    if (captchaStore[key].expiresAt < now) {
      delete captchaStore[key];
    }
  });
}

// 定期清理过期验证码（每5分钟）
setInterval(cleanExpiredCaptchas, 5 * 60 * 1000);

/**
 * 获取验证码接口
 * GET /api/login/captcha?token=xxx&phone=xxx
 */
router.get("/login/captcha", (req: Request, res: Response) => {
  try {
    const { token, phone } = req.query;
    
    // 参数校验
    if (!token || !phone) {
      res.status(400).json({
        status: 'error',
        message: '缺少必要参数：token和phone'
      });
      return;
    }

    // 验证手机号格式
    const phoneStr = phone as string;
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneStr)) {
      res.status(400).json({
        status: 'error',
        message: '手机号格式不正确'
      });
      return;
    }

    // 生成验证码
    const captcha = generateCaptcha();
    
    // 存储验证码，有效期5分钟
    const tokenStr = token as string;
    captchaStore[tokenStr] = {
      code: captcha,
      phone: phoneStr,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5分钟后过期
    };

    console.log(`验证码已生成 - 手机号: ${phoneStr}, 验证码: ${captcha}, Token: ${tokenStr}`);

    // 在实际生产环境中，这里应该调用短信服务发送验证码
    // 例如：await smsService.send(phoneStr, captcha);
    
    res.json({
      status: 'ok',
      message: '验证码已发送',
      // 开发环境下返回验证码（生产环境不应返回）
      captcha: process.env.NODE_ENV === 'development' ? captcha : undefined
    });
  } catch (error) {
    console.error('获取验证码时出错:', error);
    res.status(500).json({
      status: 'error',
      message: '获取验证码失败'
    });
  }
});

/**
 * 手机验证码登录接口
 * POST /api/login/mobile
 * Body: { phone, captcha, token }
 */
router.post("/login/mobile", (req: Request, res: Response) => {
  try {
    const { phone, captcha, token } = req.body;
    
    // 参数校验
    if (!phone || !captcha || !token) {
      res.status(400).json({
        status: 'error',
        message: '缺少必要参数：phone、captcha和token'
      });
      return;
    }

    // 查找验证码
    const storedCaptcha = captchaStore[token];
    
    if (!storedCaptcha) {
      res.status(400).json({
        status: 'error',
        message: '验证码不存在或已过期'
      });
      return;
    }

    // 验证手机号是否匹配
    if (storedCaptcha.phone !== phone) {
      res.status(400).json({
        status: 'error',
        message: '手机号不匹配'
      });
      return;
    }

    // 验证是否过期
    if (storedCaptcha.expiresAt < Date.now()) {
      delete captchaStore[token];
      res.status(400).json({
        status: 'error',
        message: '验证码已过期'
      });
      return;
    }

    // 验证验证码是否正确
    if (storedCaptcha.code !== captcha) {
      res.status(400).json({
        status: 'error',
        message: '验证码错误'
      });
      return;
    }

    // 验证成功，删除验证码（一次性使用）
    delete captchaStore[token];

    // 登录成功，设置权限
    setAccess('user');
    
    console.log(`手机号 ${phone} 登录成功`);

    res.json({
      status: 'ok',
      type: 'mobile',
      currentAuthority: 'user',
      message: '登录成功'
    });
  } catch (error) {
    console.error('手机登录时出错:', error);
    res.status(500).json({
      status: 'error',
      message: '登录失败'
    });
  }
});

// 登录接口
router.post("/login/account", (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      // 获取查询参数中的token（如果存在）
      const token = req.query.token;
      
      // 从请求体中获取登录信息
      const { password, username, type } = req.body;
      
      // 管理员登录
      if (password === 'ant.design2025' && username === 'admin') {
        setAccess('admin');
        res.json({
          status: 'ok',
          type,
          currentAuthority: 'admin',
        });
        return;
      }
      
      // 普通用户登录
      if (password === '666999' && username === 'user') {
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