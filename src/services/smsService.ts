/*
 * @Author: Diana Tang
 * @Date: 2026-01-01
 * @LastEditors: Diana Tang
 * @Description: 阿里云短信服务
 * @FilePath: /ai-health-news-agent-back/src/services/smsService.ts
 */

import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
import Util, * as $Util from '@alicloud/tea-util';
// @ts-ignore - 阿里云凭据模块可能没有类型定义
import Credential from '@alicloud/credentials';

/**
 * 短信服务配置接口
 */
interface SmsConfig {
  signName: string;      // 短信签名
  templateCode: string;  // 短信模板代码
}

/**
 * 短信服务类
 */
class SmsService {
  private client: Dysmsapi20170525;
  private signName: string;
  private templateCode: string;

  constructor(config?: SmsConfig) {
    // 创建客户端
    this.client = this.createClient();
    
    // 从环境变量或配置中获取短信签名和模板代码
    this.signName = config?.signName || process.env.ALIYUN_SMS_SIGN_NAME || '';
    this.templateCode = config?.templateCode || process.env.ALIYUN_SMS_TEMPLATE_CODE || '';

    if (!this.signName || !this.templateCode) {
      console.warn('⚠️ 阿里云短信签名或模板代码未配置');
    }
  }

  /**
   * 创建阿里云短信客户端
   * @returns Dysmsapi20170525
   */
  private createClient(): Dysmsapi20170525 {
    // 工程代码建议使用更安全的无 AK 方式
    // 凭据配置方式请参见：https://help.aliyun.com/document_detail/378664.html
    // 阿里云 SDK 将会按照默认凭据链的顺序查找相关凭据信息
    let credential = new Credential();
    
    let config = new $OpenApi.Config({
      credential: credential,
    });
    
    // Endpoint 请参考 https://api.aliyun.com/product/Dysmsapi
    config.endpoint = 'dysmsapi.aliyuncs.com';
    
    return new Dysmsapi20170525(config);
  }

  /**
   * 发送验证码短信
   * @param phoneNumber 手机号
   * @param code 验证码
   * @returns Promise<boolean> 是否发送成功
   */
  async sendCaptcha(phoneNumber: string, code: string): Promise<boolean> {
    try {
      // 验证手机号格式
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        console.error('❌ 手机号格式不正确:', phoneNumber);
        return false;
      }

      // 验证配置
      if (!this.signName || !this.templateCode) {
        console.error('❌ 短信签名或模板代码未配置');
        return false;
      }

      // 构建短信参数
      // 模板变量需要根据您在阿里云控制台创建的模板来设置
      // 例如模板内容为：您的验证码是${code}，有效期5分钟
      const templateParam = JSON.stringify({ code });

      // 创建发送短信请求
      let sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
        phoneNumbers: phoneNumber,
        signName: this.signName,
        templateCode: this.templateCode,
        templateParam: templateParam,
      });

      // 发送短信
      console.log(`📤 正在发送验证码短信到 ${phoneNumber}...`);
      let resp = await this.client.sendSmsWithOptions(
        sendSmsRequest, 
        new $Util.RuntimeOptions({})
      );

      // 检查响应
      if (resp.body?.code === 'OK') {
        console.log(`✅ 验证码短信发送成功 - 手机号: ${phoneNumber}, RequestId: ${resp.body.requestId}`);
        return true;
      } else {
        console.error(`❌ 验证码短信发送失败 - Code: ${resp.body?.code}, Message: ${resp.body?.message}`);
        return false;
      }
    } catch (error: any) {
      // 错误处理
      console.error('❌ 发送短信时出错:');
      console.error('  错误信息:', error.message);
      
      if (error.data && error.data['Recommend']) {
        console.error('  诊断地址:', error.data['Recommend']);
      }
      
      return false;
    }
  }

  /**
   * 批量发送短信
   * @param phoneNumbers 手机号数组
   * @param code 验证码
   * @returns Promise<boolean> 是否全部发送成功
   */
  async sendBatchCaptcha(phoneNumbers: string[], code: string): Promise<boolean> {
    try {
      const results = await Promise.all(
        phoneNumbers.map(phone => this.sendCaptcha(phone, code))
      );
      return results.every(result => result === true);
    } catch (error) {
      console.error('❌ 批量发送短信时出错:', error);
      return false;
    }
  }

  /**
   * 发送通用短信（可自定义模板参数）
   * @param phoneNumber 手机号
   * @param templateCode 模板代码
   * @param templateParam 模板参数对象
   * @returns Promise<boolean> 是否发送成功
   */
  async sendSms(
    phoneNumber: string,
    templateCode: string,
    templateParam: Record<string, any>
  ): Promise<boolean> {
    try {
      let sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
        phoneNumbers: phoneNumber,
        signName: this.signName,
        templateCode: templateCode,
        templateParam: JSON.stringify(templateParam),
      });

      let resp = await this.client.sendSmsWithOptions(
        sendSmsRequest,
        new $Util.RuntimeOptions({})
      );

      if (resp.body?.code === 'OK') {
        console.log(`✅ 短信发送成功 - 手机号: ${phoneNumber}, RequestId: ${resp.body.requestId}`);
        return true;
      } else {
        console.error(`❌ 短信发送失败 - Code: ${resp.body?.code}, Message: ${resp.body?.message}`);
        return false;
      }
    } catch (error: any) {
      console.error('❌ 发送短信时出错:', error.message);
      if (error.data && error.data['Recommend']) {
        console.error('  诊断地址:', error.data['Recommend']);
      }
      return false;
    }
  }
}

// 导出单例实例
export const smsService = new SmsService();

// 也可以导出类，允许使用自定义配置创建实例
export default SmsService;

