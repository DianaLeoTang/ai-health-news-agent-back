/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 13:16:48
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/services/sendEmail.ts
 */
import nodemailer from 'nodemailer';
import { EMAIL } from './config';
import fs from 'fs';
import path from 'path';
// Using a direct path resolve approach instead of import.meta.url

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(): Promise<void> {
  // Use a relative path from the project root instead of __dirname
  const reportHtml = fs.readFileSync(path.resolve(process.cwd(), 'reports/report.html'), 'utf-8');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL.USER,
      pass: EMAIL.PASS
    }
  });

  const mailOptions: MailOptions = {
    from: EMAIL.USER,
    to: 'recipient@example.com',
    subject: 'Daily Public Health News Report',
    html: reportHtml
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', (error as Error).message);
  }
}