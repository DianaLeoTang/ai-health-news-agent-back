/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 13:16:40
 * @LastEditors: Diana Tang
 * @Description: 生成 Markdown/HTML 报告
 * @FilePath: /AI-Health-News-Agent/src/generateReport.js
 */
const fs = require('fs');
const markdownIt = require('markdown-it');
const path = require('path');

async function generateReport(newsData) {
    let markdownContent = `# Daily Public Health News Report \\n\\n`;
    
    newsData.forEach(article => {
        markdownContent += `## [${article.title}](${article.link}) \\n\\n ${article.summary} \\n\\n---\\n`;
    });

    fs.writeFileSync(path.join(__dirname, '../reports/report.md'), markdownContent);
    fs.writeFileSync(path.join(__dirname, '../reports/report.html'), markdownIt().render(markdownContent));

    return markdownContent;
}

module.exports = { generateReport };
