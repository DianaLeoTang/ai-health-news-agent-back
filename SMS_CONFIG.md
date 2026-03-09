# 阿里云短信服务配置指南

## 📝 概述

本项目已集成阿里云短信服务，用于发送手机验证码。以下是详细的配置步骤。

## 🔧 环境变量配置

在 `.env` 文件中添加以下配置：

```bash
# 阿里云短信服务配置
# 短信签名名称（需要在阿里云控制台申请）
ALIYUN_SMS_SIGN_NAME=你的短信签名

# 短信模板代码（需要在阿里云控制台创建）
# 模板示例：您的验证码是${code}，有效期5分钟
ALIYUN_SMS_TEMPLATE_CODE=SMS_xxxxxxxx
```

## 🔐 阿里云访问凭证配置

阿里云 SDK 支持多种凭据配置方式，按照以下优先级顺序查找：

### 方式1：使用环境变量（AccessKey）

```bash
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret
```

**优点：** 简单直接  
**缺点：** 安全性较低，不建议在生产环境使用  
**适用场景：** 本地开发测试

### 方式2：使用 RAM 角色（推荐）

如果应用部署在阿里云 ECS 上，可以使用 RAM 角色：

```bash
ALIBABA_CLOUD_ECS_METADATA=your_role_name
```

**优点：** 安全性高，无需管理密钥  
**缺点：** 仅适用于阿里云 ECS  
**适用场景：** 生产环境（ECS 部署）

### 方式3：使用配置文件

在用户主目录下创建 `~/.alibabacloud/credentials` 文件：

```ini
[default]
type = access_key
access_key_id = your_access_key_id
access_key_secret = your_access_key_secret
```

**优点：** 不会暴露在代码中  
**缺点：** 需要手动配置文件  
**适用场景：** 本地开发

### 方式4：使用 STS Token

```bash
ALIBABA_CLOUD_ACCESS_KEY_ID=your_access_key_id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your_access_key_secret
ALIBABA_CLOUD_SECURITY_TOKEN=your_security_token
```

**优点：** 临时凭证，安全性高  
**缺点：** 需要定期刷新  
**适用场景：** 需要临时访问权限的场景

## 📱 在阿里云控制台配置短信服务

### 1. 开通短信服务

1. 登录 [阿里云控制台](https://www.aliyun.com/)
2. 搜索并进入 **短信服务**
3. 开通服务并完成实名认证

### 2. 创建短信签名

1. 在短信服务控制台，点击 **国内消息** > **签名管理**
2. 点击 **添加签名**
3. 填写签名信息：
   - **签名名称**：例如 "健康资讯"
   - **签名来源**：选择适合的来源（如网站、APP等）
   - **签名用途**：选择 "验证码"
4. 提交审核（通常1-2个工作日）
5. 审核通过后，将签名名称填入 `ALIYUN_SMS_SIGN_NAME`

### 3. 创建短信模板

1. 在短信服务控制台，点击 **国内消息** > **模板管理**
2. 点击 **添加模板**
3. 填写模板信息：
   - **模板类型**：验证码
   - **模板名称**：例如 "登录验证码"
   - **模板内容**：`您的验证码是${code}，有效期5分钟`
   - **申请说明**：说明模板用途
4. 提交审核（通常1-2个工作日）
5. 审核通过后，将模板代码（如 `SMS_123456789`）填入 `ALIYUN_SMS_TEMPLATE_CODE`

### 4. 获取 AccessKey

1. 点击右上角头像 > **AccessKey 管理**
2. 建议创建 **RAM 用户** 并授予短信服务权限（更安全）
3. 创建 AccessKey，保存 `AccessKey ID` 和 `AccessKey Secret`
4. 将其配置到环境变量或凭据文件中

## 🚀 使用示例

### 在路由中使用（已集成）

```typescript
import { smsService } from '../services/smsService';

// 发送验证码
const success = await smsService.sendCaptcha('13800138000', '123456');
```

### 自定义配置

```typescript
import SmsService from '../services/smsService';

const customSmsService = new SmsService({
  signName: '自定义签名',
  templateCode: 'SMS_xxxxxxxx'
});

await customSmsService.sendCaptcha('13800138000', '123456');
```

## 🔍 调试与日志

短信服务会输出详细的日志：

- ✅ `验证码短信发送成功` - 发送成功
- ❌ `验证码短信发送失败` - 发送失败，会显示错误代码和消息
- ⚠️ `阿里云短信签名或模板代码未配置` - 配置缺失警告

## 💰 费用说明

- 阿里云短信服务按量计费
- 验证码短信：约 0.045 元/条（具体以阿里云官网为准）
- 建议设置费用预警，避免超支

## 🔒 安全建议

1. **不要将 AccessKey 提交到代码仓库**
2. **使用 RAM 用户**，而不是主账号的 AccessKey
3. **最小权限原则**：只授予短信服务相关权限
4. **定期轮换** AccessKey
5. **生产环境使用 RAM 角色或 STS Token**
6. **添加发送频率限制**，防止恶意调用

## 📚 相关文档

- [阿里云短信服务文档](https://help.aliyun.com/product/44282.html)
- [短信服务 API 文档](https://help.aliyun.com/document_detail/101414.html)
- [凭据配置指南](https://help.aliyun.com/document_detail/378664.html)
- [SDK 使用说明](https://help.aliyun.com/document_detail/215759.html)

## ❓ 常见问题

### Q: 短信发送失败，返回 "isv.BUSINESS_LIMIT_CONTROL"
A: 触发了业务限流，检查是否：
- 同一手机号发送频率过高（默认1分钟1条，1小时5条，1天10条）
- 同一IP发送频率过高

### Q: 返回 "isv.INVALID_PARAMETERS"
A: 参数错误，检查：
- 手机号格式是否正确
- 模板变量是否匹配
- 签名和模板是否已审核通过

### Q: 开发环境如何测试？
A: 
- 开发环境下，即使短信发送失败，接口也会返回验证码
- 可以在响应中看到 `captcha` 字段用于测试
- 生产环境不会返回验证码

### Q: 如何避免短信轰炸？
A: 建议添加以下限制：
- 同一手机号60秒内只能发送1次
- 同一IP每小时最多发送10次
- 添加图形验证码
- 记录发送日志，监控异常

## 🎯 下一步

1. 在 `.env` 文件中配置相关环境变量
2. 在阿里云控制台完成签名和模板的申请
3. 配置访问凭证
4. 重启服务并测试
5. 根据需要添加频率限制和监控

---

如有问题，请参考阿里云官方文档或联系技术支持。

