/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 13:16:48
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/src/sendEmail.js
 */
const nodemailer = require('nodemailer');
const { EMAIL } = require('../config/config');
const fs = require('fs');
const path = require('path');

async function sendEmail() {
    let reportHtml = fs.readFileSync(path.join(__dirname, '../reports/report.html'), 'utf-8');

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL.USER,
            pass: EMAIL.PASS
        }
    });

    let mailOptions = {
        from: EMAIL.USER,
        to: 'recipient@example.com',
        subject: 'Daily Public Health News Report',
        html: reportHtml
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = { sendEmail };
