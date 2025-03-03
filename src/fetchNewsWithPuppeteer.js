/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 14:05:52
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/src/fetchNewsWithPuppeteer.js
 */
const puppeteer = require('puppeteer');
const { NEWS_SOURCES } = require('../config/config');
async function fetchNewsWithPuppeteer(url) {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2' });

        const articles = await page.evaluate(() => {
            let news = [];
            document.querySelectorAll('article').forEach(el => {
                let title = el.querySelector('h2, h3')?.innerText.trim();
                let link = el.querySelector('a')?.href;
                let summary = el.querySelector('p')?.innerText.trim();

                if (title && link) {
                    news.push({ title, link, summary: summary || 'No summary available' });
                }
            });
            return news;
        });

        await browser.close();
        return articles;
    } catch (error) {
        console.error(`❌ Error fetching news from ${url}: ${error.message}`);
        return [];
    }
}
async function getAllNews() {
    let allNews = [];
    for (let source of NEWS_SOURCES) {
        let news = await fetchNewsWithPuppeteer(source);
        allNews.push(...news);
    }
    return allNews;
}

module.exports = { getAllNews };