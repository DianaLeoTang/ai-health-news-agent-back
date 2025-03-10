// src/routes/novel-routes.ts
import express, { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";
import * as novelController from "../controllers/novelController";

// 配置multer
const storage = multer.diskStorage({
  destination: (
    req: express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    // 使用固定路径存储文件，不依赖用户ID
    const uploadDir = path.join(__dirname, "../uploads/pdfs");
    
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (
    req: express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  },
});

const fileFilter = (
  req: express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("只接受PDF文件"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// 创建路由
const router = Router();

// 路由定义，不使用任何认证
router.post(
  "/novels/upload",
  upload.single("file"),
  novelController.uploadPdf as express.RequestHandler
);

router.get(
  "/:id", 
  novelController.getNovelContent as express.RequestHandler
);

router.get(
  "/:id/chapters/:chapterIndex",
  novelController.getChapterContent as express.RequestHandler
);

router.post(
  "/:id/progress",
  novelController.updateReadingProgress as express.RequestHandler
);

export default router;