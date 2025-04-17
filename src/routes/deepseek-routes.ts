/*
 * @Author: Diana Tang
 * @Date: 2025-04-17 17:07:10
 * @LastEditors: Diana Tang
 * @Description: 使用底层 HTTP 调用实现与阿里云通义千问的通信
 * @FilePath: /AI-Health-News-Agent-Back/src/routes/deepseek-routes.ts
 */
import { Router } from "express";
import https from "https";
import process from "process";

const router = Router();

const BAILIAN_API_KEY = process.env.BAILIAN_API_KEY;
const BAILIAN_APP_ID = process.env.BAILIAN_APP_ID;
console.log("🟢 BAILIAN_API_KEY:", BAILIAN_API_KEY);
console.log("🟢 BAILIAN_APP_ID:", BAILIAN_APP_ID);

router.post("/chat", (req, res) => {
  try {
    const { prompt, sessionId } = req.body;

    if (!prompt) {
      throw new Error("缺少 prompt 参数");
    }

    console.log("🟢 正在处理 Prompt:", prompt);

    const postData = JSON.stringify({
      input: {
        prompt,
        session_id: sessionId || null,
      },
      parameters: {
        incremental_output: true,
      },
      debug: {},
    });

    const options = {
      hostname: "dashscope.aliyuncs.com",
      path: `/api/v1/apps/${BAILIAN_APP_ID}/completion`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${BAILIAN_API_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        "X-DashScope-SSE": "enable",
      },
    };

    // 设置 SSE 响应头
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const externalReq = https.request(options, (externalRes) => {
      externalRes.setEncoding("utf8");

      externalRes.on("data", (chunk) => {
        console.log("Received chunk:", chunk);
        // 直接将阿里云的响应转发给客户端
        res.write(chunk);
      });

      externalRes.on("end", () => {
        console.log("Stream ended");
        if (res && typeof res.end === "function") {
          res.end();
        }
      });

      // 处理客户端断开连接的情况
      res.on("close", () => {
        console.log("Client disconnected");
        if (externalRes.destroy) externalRes.destroy(); // 更稳
        // externalRes.socket.end();
      });
    });

    externalReq.on("error", (error) => {
      console.error("Request error:", error);
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: "发生错误" })}\n\n`
      );
      res.end();
    });

    // 发送请求到阿里云 API
    externalReq.write(postData);
    externalReq.end();
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(400).json({
      error: (error as Error)?.message || "处理请求时发生错误",
    });
  }
});

export default router;
