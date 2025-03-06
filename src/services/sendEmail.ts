/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 13:16:48
 * @LastEditors: Diana Tang
 * @Description: Email sending service
 * @FilePath: /AI-Health-News-Agent-Back/src/services/sendEmail.ts
 */
import nodemailer from 'nodemailer';
import { EMAIL } from './config';
import fs from 'fs';
import path from 'path';

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    path: string;
  }[];
}

/**
 * 发送包含健康新闻报告的电子邮件
 * @param to 收件人邮箱，如未提供则使用默认收件人
 * @param subject 邮件主题，如未提供则使用默认主题
 * @param attachments 附件列表
 * @returns Promise<void>
 */
export async function sendEmail(
  to: string = 'recipient@example.com',
  subject: string = 'Daily Public Health News Report',
  attachments?: { filename: string; path: string }[]
): Promise<void> {
  // 检查邮箱配置
  if (!EMAIL.USER || !EMAIL.PASS) {
    throw new Error('邮件发送者地址或密码未配置');
  }

  try {
    // 读取报告HTML文件
    const reportHtmlPath = path.resolve(process.cwd(), 'reports/report.html');
    const reportHtml = fs.readFileSync(reportHtmlPath, 'utf-8');

    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL.USER,
        pass: EMAIL.PASS
      }
    });

    // 邮件选项
    const mailOptions: MailOptions = {
      from: EMAIL.USER,
      to,
      subject,
      html: reportHtml
    };

    // 如果提供了附件，添加到邮件中
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments;
    }

    // 发送邮件
    await transporter.sendMail(mailOptions);
    console.log('邮件发送成功!');
  } catch (error) {
    console.error('发送邮件时出错:', (error as Error).message);
    throw error; // 重新抛出错误，让调用者知道发送失败
  }
}