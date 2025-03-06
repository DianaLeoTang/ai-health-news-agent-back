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
/*
 * @Author: Diana Tang
 * @Date: 2025-03-06 21:12:18
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/netlify/functions/simple-api.ts
 */
// netlify/functions/simple-api.ts
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    // 简单的路由逻辑
    const path = event.path.replace('/.netlify/functions/simple-api', '');
    if (path === '/hello') {
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Hello endpoint" })
        };
    }
    if (path === '/news') {
        return {
            statusCode: 200,
            body: JSON.stringify({ news: [{ title: "Test News", content: "This is a test" }] })
        };
    }
    return {
        statusCode: 404,
        body: JSON.stringify({ error: "Not found" })
    };
});
exports.handler = handler;
