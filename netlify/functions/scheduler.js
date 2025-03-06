"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const fetchNewsWithPuppeteer_1 = require("../../src/services/fetchNewsWithPuppeteer");
// 标准 Netlify Functions 格式
const handler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    // 检查是否是定时触发
    if (event.body === '{"scheduled":true}') {
        try {
            console.log('开始自动抓取新闻');
            const news = yield (0, fetchNewsWithPuppeteer_1.fetchNewsWithPuppeteer)();
            console.log(`成功抓取 ${news.length} 条新闻`);
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true })
            };
        }
        catch (error) {
            console.error('自动抓取新闻失败:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch news' })
            };
        }
    }
    // 如果不是定时触发，可能是手动调用
    return {
        statusCode: 200,
        body: JSON.stringify({ message: '这个函数主要用于定时任务，但也可以手动调用' })
    };
});
exports.handler = handler;
