/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 13:17:04
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/config/config.js
 */
module.exports = {
    NEWS_SOURCES: [
        'https://www.who.int/news',
        'https://www.cdc.gov/media/releases.html',
        'https://www.nature.com/subjects/public-health/rss'
    ],
    EMAIL: {
        USER: process.env.EMAIL_USER,
        PASS: process.env.EMAIL_PASS
    },
    SERVER: {
        PORT: process.env.PORT || 3000
    }
};
