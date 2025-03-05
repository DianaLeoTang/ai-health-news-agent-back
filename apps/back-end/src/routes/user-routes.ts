/*
 * @Author: Diana Tang
 * @Date: 2025-03-05
 * @LastEditors: Diana Tang
 * @Description: 用户信息相关路由
 * @FilePath: /AI-Health-News-Agent/apps/back-end/src/routes/user-routes.ts
 */
import { Router, Request, Response } from 'express';

const router = Router();

// 从auth-routes中获取access，实际项目中应该使用更安全的方式如session/JWT
// 这里简化处理，假设auth-routes.ts中维护了全局access变量
let access = 'guest'; // 初始值

// 提供给auth-routes用于更新access值的方法
export const setAccess = (newAccess: string) => {
  access = newAccess;
};

// 获取当前登录用户的访问权限
const getAccess = () => {
  return access;
};

// 获取当前用户信息
router.get("/currentUser", (req: Request, res: Response) => {
  // 验证用户是否已登录
  if (!getAccess() || getAccess() === 'guest') {
    res.status(401).send({
      data: {
        isLogin: false,
      },
      errorCode: '401',
      errorMessage: '请先登录！',
      success: true,
    });
    return;
  }
  console.log('走了？')
  // 根据不同的用户角色返回不同的用户信息（可根据实际需求修改）
  const userInfo = {
    name: 'Serati Ma',
    avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
    userid: '00000001',
    email: 'antdesign@alipay.com',
    signature: '海纳百川，有容乃大',
    title: '交互专家',
    group: '蚂蚁金服－某某某事业群－某某平台部－某某技术部－UED',
    tags: [
      {
        key: '0',
        label: '很有想法的',
      },
      {
        key: '1',
        label: '专注设计',
      },
      {
        key: '2',
        label: '辣~',
      },
      {
        key: '3',
        label: '大长腿',
      },
      {
        key: '4',
        label: '川妹子',
      },
      {
        key: '5',
        label: '海纳百川',
      },
    ],
    notifyCount: 12,
    unreadCount: 11,
    country: 'China',
    access: getAccess(), // 当前用户的权限
    geographic: {
      province: {
        label: '浙江省',
        key: '330000',
      },
      city: {
        label: '杭州市',
        key: '330100',
      },
    },
    address: '西湖区工专路 77 号',
    phone: '0752-268888888',
  };
  
  res.send({
    success: true,
    data: userInfo,
  });
});

export default router;