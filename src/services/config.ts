/*
 * @Author: Diana Tang
 * @Date: 2025-03-06 16:24:10
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/services/config.ts
 */
import { CrawlerConfig, EmailConfig, ServerConfig, Config } from "./types";

const config: Config = {
  // 合并后的NEWS_SOURCES数组
  NEWS_SOURCES: [
    "https://jamanetwork.com/",
    "https://jamanetwork.com/journals/jama-health-forum",
    "https://jamanetwork.com/journals/jama",
    "https://www.nejm.org/equity",
    "https://www.nejm.org/browse/specialty/climate-change",
    "https://www.nejm.org/ai-in-medicine",
    "https://www.who.int/news-room/headlines",
    "https://www.bmj.com/",
    "https://www.bmj.com/news/news",
    "https://www.annualreviews.org/content/journals/soc",
    "https://www.annualreviews.org/content/journals/publhealth",
    "https://www.annualreviews.org/content/journals/nutr",
    "https://www.nature.com/collections/ggahieiica",
    "https://www.nature.com/nm/articles?type=research-highlight",
    "https://www.cdc.gov/media/site.html",
    "https://www.nature.com/subjects/health-sciences/nature",
    "https://news.un.org/en/news/topic/health",
    "https://www.thelancet.com/journals/lanpub/home",
    "https://www.who.int/news-room",
    "https://news.un.org/en/news/topic/women",
    "https://www.thelancet.com/journals/langlo",
    "https://www.annualreviews.org/journal/publhealth",
    "https://ajph.aphapublications.org",
    "https://jogh.org",
    "https://www.ajpmonline.org",
    "https://www.journals.elsevier.com/preventive-medicine",
    "https://www.nejm.org",
    "https://www.thelancet.com",
    "https://www.bmj.com",
    "https://www.acpjournals.org/journal/aim",
    "https://www.nature.com/nm",
    "https://www.thelancet.com/journals/laninf",
    "https://www.cell.com",
    "https://journals.plos.org/plosmedicine",
    "https://www.jci.org",
    "https://www.jahonline.org",
    "https://www.jpeds.com",
    "https://bmcpediatr.biomedcentral.com",
    "https://www.mdpi.com/journal/nutrients",
    "https://www.cambridge.org/core/journals/public-health-nutrition",
    "https://academic.oup.com/toxsci",
    "https://www.journals.elsevier.com/toxicology",
    "https://www.springer.com/journal/403",
    "https://www.journals.elsevier.com/toxicology-letters",
    "https://www.journals.elsevier.com/social-science-and-medicine",
    "https://tobaccocontrol.bmj.com",
    "https://jech.bmj.com",
    'https://jech.bmj.com/content/79/4?current-issue=y',
    "https://journals.lww.com/medicalcare/pages/default.aspx",
    "https://onlinelibrary.wiley.com/journal/10991166",
    "https://www.healthaffairs.org",
    "https://equityhealthj.biomedcentral.com",
    "https://academic.oup.com/ije",
    "https://onlinelibrary.wiley.com/journal/10970258",
    "https://www.springer.com/journal/10654",
    "https://www.annualreviews.org/journal/epidem",
    "https://www.nature.com/ijo",
    "https://www.ahajournals.org/journal/hyp",
    "https://www.thelancet.com/journals/landia",
    "https://ehp.niehs.nih.gov",
    "https://www.journals.elsevier.com/environmental-research",
    "https://oem.bmj.com",
    "https://www.sjweh.fi",
  ],
  NEWS_SOURCESAA: [
    "https://jamanetwork.com/",
    "https://jamanetwork.com/journals/jama-health-forum",
    "https://jamanetwork.com/journals/jama",
    "https://www.nejm.org/equity",
    "https://www.nejm.org/browse/specialty/climate-change",
    "https://www.nejm.org/ai-in-medicine",
    "https://www.who.int/news-room/headlines",
    "https://www.bmj.com/",
    "https://www.bmj.com/news/news",
    "https://www.annualreviews.org/content/journals/soc",
    "https://www.annualreviews.org/content/journals/publhealth",
    "https://www.annualreviews.org/content/journals/nutr",
    "https://www.nature.com/collections/ggahieiica",
    "https://www.nature.com/nm/articles?type=research-highlight",
    "https://www.cdc.gov/media/site.html",
    "https://www.nature.com/subjects/health-sciences/nature",
    "https://news.un.org/en/news/topic/health",
    "https://www.thelancet.com/journals/lanpub/home",
    "https://www.who.int/news-room",
    "https://news.un.org/en/news/topic/women",

    // 'https://www.thelancet.com/rssfeed/public-health'
  ],
  NEWS_SOURCES_FEED: [
    "https://www.nejm.org/action/showFeed?jc=nejm&type=etoc&feed=rss",
    "https://www.who.int/rss-feeds/news-english.xml",
    "https://www.annualreviews.org/rss/content/journals/publhealth/latestarticles?fmt=rss",
    "https://tools.cdc.gov/podcasts/rss.asp",
    "https://www.nature.com/nm.rss",
    "https://news.un.org/feed/subscribe/en/news/topic/health/feed/rss.xml",
    "https://news.un.org/feed/subscribe/en/news/topic/women/feed/rss.xml",
    "https://www.thelancet.com/rssfeed/lanpub_current.xml",
    "https://jogh.org/feed/",
    "https://www.cell.com/cell/current.rss",
    "https://www.jci.org/rss.xml",
  ],
  NEWS_OFFICEAA: [
    { "Lancet Global Health": "https://www.thelancet.com/journals/langlo" },
    {
      "Annual Review of Public Health":
        "https://www.annualreviews.org/journal/publhealth",
    },
    {
      "American Journal of Public Health": "https://ajph.aphapublications.org",
    },
    { "Journal of Global Health": "https://jogh.org" },
    { "American Journal of Preventive Medicine": "https://www.ajpmonline.org" },
    {
      "Preventive Medicine":
        "https://www.journals.elsevier.com/preventive-medicine",
    },
    { "The New England Journal of Medicine (NEJM)": "https://www.nejm.org" },
    { "The Lancet": "https://www.thelancet.com" },
    {
      "JAMA (Journal of the American Medical Association)":
        "https://jamanetwork.com/journals/jama",
    },
    { "BMJ (British Medical Journal)": "https://www.bmj.com" },
    {
      "Annals of Internal Medicine": "https://www.acpjournals.org/journal/aim",
    },
    { "Nature Medicine": "https://www.nature.com/nm" },
    {
      "Lancet Infectious Diseases": "https://www.thelancet.com/journals/laninf",
    },
    { Cell: "https://www.cell.com" },
    { "PLOS Medicine": "https://journals.plos.org/plosmedicine" },
    { "The Journal of Clinical Investigation (JCI)": "https://www.jci.org" },
    { "Journal of Adolescent": "https://www.jahonline.org" },
    { "The Journal of Pediatrics": "https://www.jpeds.com" },
    { "BMC Pediatrics": "https://bmcpediatr.biomedcentral.com" },
    { Nutrients: "https://www.mdpi.com/journal/nutrients" },
    {
      "Public Health Nutrition":
        "https://www.cambridge.org/core/journals/public-health-nutrition",
    },
    { "Toxicological Sciences": "https://academic.oup.com/toxsci" },
    { Toxicology: "https://www.journals.elsevier.com/toxicology" },
    { "Archives of Toxicology": "https://www.springer.com/journal/403" },
    {
      "Toxicology Letters":
        "https://www.journals.elsevier.com/toxicology-letters",
    },
    {
      "Social Science Medicine":
        "https://www.journals.elsevier.com/social-science-and-medicine",
    },
    { "Tobacco Control": "https://tobaccocontrol.bmj.com" },
    { "Epidemiology and Community Health": "https://jech.bmj.com" },
    {
      "Medical Care": "https://journals.lww.com/medicalcare/pages/default.aspx",
    },
    { "Health Economics": "https://onlinelibrary.wiley.com/journal/10991166" },
    { "Health Affairs": "https://www.healthaffairs.org" },
    {
      "International Journal for Equity in Health":
        "https://equityhealthj.biomedcentral.com",
    },
    { "International Journal of Epidemiology": "https://academic.oup.com/ije" },
    {
      "Statistics In Medicine":
        "https://onlinelibrary.wiley.com/journal/10970258",
    },
    {
      "European Journal of Epidemiology":
        "https://www.springer.com/journal/10654",
    },
    {
      "Annual Review of Epidemiology":
        "https://www.annualreviews.org/journal/epidem",
    },
    { "International Journal of Obesity": "https://www.nature.com/ijo" },
    { Hypertension: "https://www.ahajournals.org/journal/hyp" },
    {
      "Lancet Diabetes & Endocrinology":
        "https://www.thelancet.com/journals/landia",
    },
    { "Environmental Health Perspectives": "https://ehp.niehs.nih.gov" },
    {
      "Environmental Research":
        "https://www.journals.elsevier.com/environmental-research",
    },
    { "Occupational and Environmental Medicine": "https://oem.bmj.com" },
    {
      "Scandinavian Journal of Work Environment Health": "https://www.sjweh.fi",
    },
  ],
  // 格式化后的NEWS_OFFICE数组
  NEWS_OFFICE:[
    { title: "Lancet Global Health", url: "https://www.thelancet.com/journals/langlo" },
    { title: "Annual Review of Public Health", url: "https://www.annualreviews.org/journal/publhealth" },
    { title: "American Journal of Public Health", url: "https://ajph.aphapublications.org" },
    { title: "Journal of Global Health", url: "https://jogh.org" },
    { title: "American Journal of Preventive Medicine", url: "https://www.ajpmonline.org" },
    { title: "Preventive Medicine", url: "https://www.journals.elsevier.com/preventive-medicine" },
    { title: "The New England Journal of Medicine (NEJM)", url: "https://www.nejm.org" },
    { title: "The Lancet", url: "https://www.thelancet.com" },
    { title: "JAMA (Journal of the American Medical Association)", url: "https://jamanetwork.com/journals/jama" },
    { title: "BMJ (British Medical Journal)", url: "https://www.bmj.com" },
    { title: "Annals of Internal Medicine", url: "https://www.acpjournals.org/journal/aim" },
    { title: "Nature Medicine", url: "https://www.nature.com/nm" },
    { title: "Lancet Infectious Diseases", url: "https://www.thelancet.com/journals/laninf" },
    { title: "Cell", url: "https://www.cell.com" },
    { title: "PLOS Medicine", url: "https://journals.plos.org/plosmedicine" },
    { title: "The Journal of Clinical Investigation (JCI)", url: "https://www.jci.org" },
    { title: "Journal of Adolescent", url: "https://www.jahonline.org" },
    { title: "The Journal of Pediatrics", url: "https://www.jpeds.com" },
    { title: "BMC Pediatrics", url: "https://bmcpediatr.biomedcentral.com" },
    { title: "Nutrients", url: "https://www.mdpi.com/journal/nutrients" },
    { title: "Public Health Nutrition", url: "https://www.cambridge.org/core/journals/public-health-nutrition" },
    { title: "Toxicological Sciences", url: "https://academic.oup.com/toxsci" },
    { title: "Toxicology", url: "https://www.journals.elsevier.com/toxicology" },
    { title: "Archives of Toxicology", url: "https://www.springer.com/journal/403" },
    { title: "Toxicology Letters", url: "https://www.journals.elsevier.com/toxicology-letters" },
    { title: "Social Science Medicine", url: "https://www.journals.elsevier.com/social-science-and-medicine" },
    { title: "Tobacco Control", url: "https://tobaccocontrol.bmj.com" },
    { title: "Epidemiology and Community Health", url: "https://jech.bmj.com" },
    {title: "Epidemiology and Community Health", url:'https://jech.bmj.com/content/79/4?current-issue=y'},
    { title: "Medical Care", url: "https://journals.lww.com/medicalcare/pages/default.aspx" },
    { title: "Health Economics", url: "https://onlinelibrary.wiley.com/journal/10991166" },
    { title: "Health Affairs", url: "https://www.healthaffairs.org" },
    { title: "International Journal for Equity in Health", url: "https://equityhealthj.biomedcentral.com" },
    { title: "International Journal of Epidemiology", url: "https://academic.oup.com/ije" },
    { title: "Statistics In Medicine", url: "https://onlinelibrary.wiley.com/journal/10970258" },
    { title: "European Journal of Epidemiology", url: "https://www.springer.com/journal/10654" },
    { title: "Annual Review of Epidemiology", url: "https://www.annualreviews.org/journal/epidem" },
    { title: "International Journal of Obesity", url: "https://www.nature.com/ijo" },
    { title: "Hypertension", url: "https://www.ahajournals.org/journal/hyp" },
    { title: "Lancet Diabetes & Endocrinology", url: "https://www.thelancet.com/journals/landia" },
    { title: "Environmental Health Perspectives", url: "https://ehp.niehs.nih.gov" },
    { title: "Environmental Research", url: "https://www.journals.elsevier.com/environmental-research" },
    { title: "Occupational and Environmental Medicine", url: "https://oem.bmj.com" },
    { title: "Scandinavian Journal of Work Environment Health", url: "https://www.sjweh.fi" },
    { title: "JAMA Network", url: "https://jamanetwork.com/" },
    { title: "JAMA Health Forum", url: "https://jamanetwork.com/journals/jama-health-forum" },
    { title: "NEJM Equity", url: "https://www.nejm.org/equity" },
    { title: "NEJM Climate Change", url: "https://www.nejm.org/browse/specialty/climate-change" },
    { title: "NEJM AI in Medicine", url: "https://www.nejm.org/ai-in-medicine" },
    { title: "WHO Headlines", url: "https://www.who.int/news-room/headlines" },
    { title: "BMJ News", url: "https://www.bmj.com/news/news" },
    { title: "Annual Review of Sociology", url: "https://www.annualreviews.org/content/journals/soc" },
    { title: "Annual Review of Nutrition", url: "https://www.annualreviews.org/content/journals/nutr" },
    { title: "Nature Collections", url: "https://www.nature.com/collections/ggahieiica" },
    { title: "Nature Medicine Research Highlights", url: "https://www.nature.com/nm/articles?type=research-highlight" },
    { title: "Centers for Disease Control and Prevention", url: "https://www.cdc.gov/media/site.html" },
    { title: "Nature Health Sciences", url: "https://www.nature.com/subjects/health-sciences/nature" },
    { title: "UN News Health", url: "https://news.un.org/en/news/topic/health" },
    { title: "The Lancet Public Health", url: "https://www.thelancet.com/journals/lanpub/home" },
    { title: "World Health Organization", url: "https://www.who.int/news-room" },
    { title: "UN News Women", url: "https://news.un.org/en/news/topic/women" }
  ],
  AI_SOURCE:[
    'https://www.nature.com/search?journal=nm&q=AI',
    'https://www.kdnuggets.com/',
    'https://www.kdnuggets.com/tag/artificial-intelligence',
    'https://www.healthcareitnews.com/projects',
    'https://search.nih.gov/search?utf8=%E2%9C%93&affiliate=hip&dc=940&query=AI',
    'https://aiforgood.itu.int/',
    'https://www.jmir.org/themes/797-artificial-intelligence',
    'https://www.fiercehealthcare.com/digital-health',
    'https://www.fiercehealthcare.com/ai-and-machine-learning',
  ],
  EMAIL: {
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS,
  },
  SERVER: {
    PORT: process.env.PORT || 4000,
    NODE_ENV: process.env.NODE_ENV || "development",
  },
};
// 正确导出配置对象
export const CONFIGS: CrawlerConfig = {
  // 并发控制
  concurrentLimit: 5,

  // 请求配置
  requestTimeout: 20000,
  retries: 3,
  retryDelay: 1000,

  // 缓存配置
  useCache: true,
  cacheDir: "./.cache",
  cacheTTL: 30 * 60 * 1000, // 30分钟

  // 代理配置
  useProxy: false,
  proxyUrl: "",

  // 输出配置
  outputDir: "./data",
  saveRawHtml: false,

  // 提取配置
  selectors: {
    // 通用选择器
    title: "title",
    description: 'meta[name="description"]',
    links: "a",

    // 特定站点选择器 (优先级高于通用选择器)
    "jamanetwork.com": {
      articles: ".card-article",
      title: ".card-article h3",
      date: ".card-article .meta-date",
    },
    "nejm.org": {
      articles: ".o-article",
      title: ".o-article h4",
      authors: ".o-article .m-article-meta__authors",
    },
    "who.int": {
      articles: ".list-view--item",
      title: ".list-view--item .heading",
      date: ".list-view--item .date",
    },
  },
};
export const { NEWS_SOURCES, EMAIL, SERVER, NEWS_SOURCES_FEED, NEWS_OFFICE,AI_SOURCE } =
  config;
export default config;
