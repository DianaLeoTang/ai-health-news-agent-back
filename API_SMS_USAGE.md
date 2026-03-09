# 手机验证码登录 API 使用说明

## 📱 功能概述

已实现完整的手机验证码登录功能，集成了阿里云短信服务。

## 🔌 API 接口

### 1. 获取验证码

**接口地址：** `GET /api/login/captcha`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| token | string | 是 | 唯一标识本次验证码请求的令牌 |
| phone | string | 是 | 手机号（11位，以1开头，第二位3-9） |

**请求示例：**

```bash
GET http://localhost:8888/.netlify/functions/api/login/captcha?token=123&phone=13800138000
```

**成功响应：**

```json
{
  "status": "ok",
  "message": "验证码已发送",
  "captcha": "123456"  // 仅开发环境返回
}
```

**错误响应：**

```json
{
  "status": "error",
  "message": "手机号格式不正确"
}
```

**状态码：**
- `200` - 成功
- `400` - 参数错误
- `500` - 服务器错误

---

### 2. 验证码登录

**接口地址：** `POST /api/login/mobile`

**请求头：**
```
Content-Type: application/json
```

**请求体：**

```json
{
  "phone": "13800138000",
  "captcha": "123456",
  "token": "123"
}
```

**参数说明：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号 |
| captcha | string | 是 | 验证码 |
| token | string | 是 | 获取验证码时使用的token |

**成功响应：**

```json
{
  "status": "ok",
  "type": "mobile",
  "currentAuthority": "user",
  "message": "登录成功"
}
```

**错误响应示例：**

```json
{
  "status": "error",
  "message": "验证码错误"
}
```

**可能的错误消息：**
- `缺少必要参数：phone、captcha和token`
- `验证码不存在或已过期`
- `手机号不匹配`
- `验证码已过期`
- `验证码错误`

---

## 🔐 安全特性

### 验证码管理
- ✅ **6位数字验证码**：随机生成
- ✅ **5分钟有效期**：超时自动失效
- ✅ **一次性使用**：验证后立即删除
- ✅ **手机号绑定**：验证码与手机号严格绑定
- ✅ **自动清理**：每5分钟清理过期验证码

### 短信发送
- ✅ **阿里云短信服务**：企业级可靠性
- ✅ **发送状态检查**：失败时有明确提示
- ✅ **开发环境容错**：短信失败仍可测试

---

## 🧪 测试流程

### 方式1：使用 curl

```bash
# 1. 获取验证码
curl "http://localhost:8888/.netlify/functions/api/login/captcha?token=test123&phone=13800138000"

# 2. 使用验证码登录（将 123456 替换为实际收到的验证码）
curl -X POST http://localhost:8888/.netlify/functions/api/login/mobile \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "13800138000",
    "captcha": "123456",
    "token": "test123"
  }'
```

### 方式2：使用 Postman

**步骤1：获取验证码**
1. 新建 GET 请求
2. URL: `http://localhost:8888/.netlify/functions/api/login/captcha?token=test123&phone=13800138000`
3. 点击 Send
4. 记录返回的验证码

**步骤2：登录**
1. 新建 POST 请求
2. URL: `http://localhost:8888/.netlify/functions/api/login/mobile`
3. Headers 添加: `Content-Type: application/json`
4. Body 选择 raw，输入：
```json
{
  "phone": "13800138000",
  "captcha": "从步骤1获取的验证码",
  "token": "test123"
}
```
5. 点击 Send

### 方式3：前端集成示例

```typescript
// 获取验证码
async function getCaptcha(phone: string) {
  const token = Date.now().toString(); // 生成唯一token
  
  const response = await fetch(
    `http://localhost:8888/.netlify/functions/api/login/captcha?token=${token}&phone=${phone}`
  );
  
  const data = await response.json();
  
  if (data.status === 'ok') {
    console.log('验证码已发送');
    // 开发环境可以看到验证码
    if (data.captcha) {
      console.log('验证码:', data.captcha);
    }
    return token; // 保存token用于登录
  } else {
    console.error('获取验证码失败:', data.message);
    return null;
  }
}

// 验证码登录
async function loginWithCaptcha(phone: string, captcha: string, token: string) {
  const response = await fetch(
    'http://localhost:8888/.netlify/functions/api/login/mobile',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        captcha,
        token,
      }),
    }
  );
  
  const data = await response.json();
  
  if (data.status === 'ok') {
    console.log('登录成功');
    console.log('用户权限:', data.currentAuthority);
    return true;
  } else {
    console.error('登录失败:', data.message);
    return false;
  }
}

// 使用示例
async function handleLogin() {
  const phone = '13800138000';
  
  // 1. 获取验证码
  const token = await getCaptcha(phone);
  if (!token) return;
  
  // 2. 用户输入验证码
  const captcha = prompt('请输入验证码');
  if (!captcha) return;
  
  // 3. 登录
  await loginWithCaptcha(phone, captcha, token);
}
```

---

## 🌍 环境差异

### 开发环境 (NODE_ENV=development)
- ✅ 接口返回验证码（方便测试）
- ✅ 短信发送失败仍可继续（不阻塞测试）
- ✅ 详细的日志输出

### 生产环境 (NODE_ENV=production)
- ❌ 不返回验证码
- ❌ 短信发送失败则返回错误
- ✅ 精简的日志输出

---

## 📊 服务器日志

### 成功场景

```
验证码已生成 - 手机号: 13800138000, 验证码: 123456, Token: test123
📤 正在发送验证码短信到 13800138000...
✅ 验证码短信发送成功 - 手机号: 13800138000, RequestId: xxx
手机号 13800138000 登录成功
```

### 失败场景

```
❌ 验证码短信发送失败 - Code: isv.BUSINESS_LIMIT_CONTROL, Message: 触发业务限流
⚠️ 短信发送失败，但在开发环境会继续返回验证码
```

---

## ⚙️ 配置要求

在使用前，请确保已配置以下环境变量（在 `.env` 文件中）：

```bash
# 必需配置
ALIYUN_SMS_SIGN_NAME=你的短信签名
ALIYUN_SMS_TEMPLATE_CODE=SMS_xxxxxxxx

# 阿里云访问凭证（三选一）
# 方式1：AccessKey
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret

# 方式2：RAM角色（ECS上）
# ALIBABA_CLOUD_ECS_METADATA=your_role_name

# 方式3：配置文件
# 在 ~/.alibabacloud/credentials 中配置
```

详细配置说明请参考 [SMS_CONFIG.md](./SMS_CONFIG.md)

---

## 🚨 常见问题

### Q1: 收不到短信验证码？

**检查清单：**
1. ✅ 手机号格式是否正确
2. ✅ 阿里云短信签名和模板是否已审核通过
3. ✅ 环境变量是否正确配置
4. ✅ 阿里云账户余额是否充足
5. ✅ 是否触发了发送频率限制
6. ✅ 查看服务器日志中的错误信息

### Q2: 验证码过期时间是多久？

验证码有效期为 **5分钟**，超时后需要重新获取。

### Q3: 同一个手机号可以多次获取验证码吗？

可以，但建议添加频率限制：
- 同一手机号：60秒内只能发送1次
- 同一IP：每小时最多10次

### Q4: 开发环境如何测试？

开发环境下：
1. 接口会在响应中返回验证码
2. 即使短信发送失败也能继续测试
3. 查看控制台日志获取验证码

### Q5: 验证码可以重复使用吗？

不可以。验证码是 **一次性** 的，验证成功后会立即删除。

---

## 🔒 安全建议

### 生产环境部署前

1. **添加频率限制**
   - 同一手机号发送间隔限制
   - 同一IP发送次数限制
   - 添加图形验证码

2. **监控与告警**
   - 监控短信发送失败率
   - 设置异常发送告警
   - 记录所有发送日志

3. **成本控制**
   - 设置阿里云费用预警
   - 限制每日最大发送量
   - 定期审查发送记录

4. **安全加固**
   - 使用 HTTPS
   - 添加请求签名验证
   - 实现 IP 白名单（如需要）

---

## 📞 技术支持

如遇到问题：
1. 查看服务器日志
2. 参考 [SMS_CONFIG.md](./SMS_CONFIG.md)
3. 查看阿里云短信服务控制台
4. 联系技术支持

---

**更新时间：** 2026-01-01  
**版本：** 1.0.0

