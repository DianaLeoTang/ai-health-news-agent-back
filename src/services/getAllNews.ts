import axios from 'axios';
import cheerio from 'cheerio';

export async function getAllNews() {
  try {
    // 从多个来源获取新闻
    const newsPromises = NEWS_SOURCES.slice(0, 5).map(async (source) => {
      try {
        const response = await axios.get(source, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 5000 // 5秒超时
        });
        
        const $ = cheerio.load(response.data);
        const articles = [];
        
        // 根据不同网站选择不同的选择器
        let articleSelector = 'article, .article, .news-item, .journal-article';
        let titleSelector = 'h1, h2, h3, .title, .article-title';
        let linkSelector = 'a';
        
        // 针对特定网站的选择器调整
        if (source.includes('jamanetwork.com')) {
          articleSelector = '.article-item';
          titleSelector = '.article-full-text__title';
        } else if (source.includes('nejm.org')) {
          articleSelector = '.m-article';
          titleSelector = '.m-article__title';
        } else if (source.includes('who.int')) {
          articleSelector = '.news-item';
          titleSelector = '.news-item__title';
        }
        
        $(articleSelector).slice(0, 3).each((index, element) => {
          const titleElement = $(element).find(titleSelector).first();
          const title = titleElement.text().trim();
          
          if (!title) return; // 跳过没有标题的文章
          
          const linkElement = titleElement.closest('a').length ? 
                             titleElement.closest('a') : 
                             $(element).find(linkSelector).first();
          
          let link = linkElement.attr('href') || '';
          // 处理相对URL
          if (link && !link.startsWith('http')) {
            const baseUrl = new URL(source).origin;
            link = `${baseUrl}${link.startsWith('/') ? '' : '/'}${link}`;
          }
          
          // 尝试提取摘要
          const summarySelectors = ['.abstract', '.summary', '.excerpt', '.description', 'p'];
          let summary = '';
          
          for (const selector of summarySelectors) {
            const summaryElement = $(element).find(selector).first();
            if (summaryElement.length) {
              summary = summaryElement.text().trim();
              if (summary) break;
            }
          }
          
          if (title && link) {
            articles.push({
              title,
              link,
              summary: summary || 'No summary available',
              source
            });
          }
        });
        
        return articles;
      } catch (error) {
        console.error(`获取 ${source} 的新闻失败:`, error.message);
        return []; // 单个源失败不影响其他源
      }
    });
    
    // 合并所有来源的结果并去重
    const allNews = (await Promise.all(newsPromises)).flat();
    
    // 使用标题进行去重
    const uniqueNews = Array.from(
      new Map(allNews.map(item => [item.title, item])).values()
    );
    
    return uniqueNews.length > 0 ? uniqueNews : getFallbackNews();
  } catch (error) {
    console.error('获取新闻失败:', error);
    return getFallbackNews();
  }
}