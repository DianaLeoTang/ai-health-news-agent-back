
import fs from 'fs';
import MarkdownIt from 'markdown-it';
import path from 'path';
// Using a direct path resolve approach instead of import.meta.url

interface NewsArticle {
  title: string;
  link: string;
  summary: string;
}

export async function generateReport(newsData: NewsArticle[]): Promise<string> {
  let markdownContent = `# Daily Public Health News Report \n\n`;
  
  newsData.forEach(article => {
    markdownContent += `## [${article.title}](${article.link}) \n\n ${article.summary} \n\n---\n`;
  });

  // Use a relative path from the project root instead of __dirname
  const reportsDirPath = path.resolve(process.cwd(), 'reports');
  
  fs.writeFileSync(path.join(reportsDirPath, 'report.md'), markdownContent);
  
  const md = new MarkdownIt();
  fs.writeFileSync(path.join(reportsDirPath, 'report.html'), md.render(markdownContent));

  return markdownContent;
}