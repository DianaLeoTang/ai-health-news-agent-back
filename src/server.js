/*
 * @Author: Diana Tang
 * @Date: 2025-03-03 13:16:56
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent/src/server.js
 */
const express = require("express");
// const { getAllNews } = require('./fetchNews');
const { getAllNews } = require("./fetchNewsWithPuppeteer");
const { generateReport } = require("./generateReport");
const { sendEmail } = require("./sendEmail");
const cron = require("node-cron");
const { SERVER } = require("../config/config");

const app = express();

app.get("/news", async (req, res) => {
  let newsData = await getAllNews();
  res.json(newsData);
});
app.get("/", (req, res) => {
  res.send(
    '<h1>Welcome to AI-Health-News-Agent</h1><p>Use <a href="/news">/news</a> to get the latest public health news.</p>'
  );
});

cron.schedule("0 8 * * *", async () => {
  console.log("Running scheduled news update...");
  let newsData = await getAllNews();
  await generateReport(newsData);
  await sendEmail();
});

app.listen(SERVER.PORT, () => {
  console.log(`Server running on http://localhost:${SERVER.PORT}`);
});
