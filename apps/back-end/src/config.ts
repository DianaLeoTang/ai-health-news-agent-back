/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 13:17:04
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/apps/back-end/config/config.ts
 */

interface EmailConfig {
    USER: string | undefined;
    PASS: string | undefined;
  }
  
  interface ServerConfig {
    PORT: string | number;
  }
  
  interface Config {
    NEWS_SOURCES: string[];
    EMAIL: EmailConfig;
    SERVER: ServerConfig;
  }
  
  const config: Config = {
    NEWS_SOURCES: [
      'https://www.who.int/news-room',
      'https://www.cdc.gov/media/site.html',
      'https://www.nature.com/subjects/health-sciences/nature',
      'https://news.un.org/en/news/topic/health',
      'https://www.thelancet.com/journals/lanpub/home'
      // 'https://www.thelancet.com/rssfeed/public-health'
    ],
    EMAIL: {
      USER: process.env.EMAIL_USER,
      PASS: process.env.EMAIL_PASS
    },
    SERVER: {
      PORT: process.env.PORT || 3000
    }
  };
  
  export const { NEWS_SOURCES, EMAIL, SERVER } = config;
  export default config;