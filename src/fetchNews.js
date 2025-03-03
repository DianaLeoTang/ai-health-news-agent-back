/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 13:16:32
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/src/fetchNews.js
 */
const axios = require('axios');
const cheerio = require('cheerio');
const { NEWS_SOURCES } = require('../config/config');

async function fetchNews(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        let articles = [];

        $('article').each((i, el) => {
            let title = $(el).find('h2, h3').text().trim();
            let link = $(el).find('a').attr('href');
            let summary = $(el).find('p').text().trim();

            if (title && link) {
                articles.push({ title, link, summary: summary || 'No summary available' });
            }
        });

        return articles;
    } catch (error) {
        console.error(`Error fetching news from ${url}:`, error.message);
        return [];
    }
}

async function getAllNews() {
    let allNews = [];
    for (let source of NEWS_SOURCES) {
        let news = await fetchNews(source);
        allNews.push(...news);
    }
    return allNews;
}

module.exports = { getAllNews };
