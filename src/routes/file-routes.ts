import express, { Request, Response, Router } from "express";
import multer, { StorageEngine, FileFilterCallback } from "multer";
import path from "path";

const router: Router = Router();

// 配置存储方式
const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // 存储在 uploads 目录
  },
  filename: (req, file, cb) => {
    // 处理中文文件名
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const fileExt = path.extname(originalName);
    const safeFileName = `${Date.now()}${fileExt}`; // 生成唯一文件名
    cb(null, safeFileName);
  },
});


const upload = multer({ storage });

// 使用类型断言强制突破类型检查
const handleFileUpload = ((req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log(req.file); // 输出文件信息
  res.status(200).json({ message: "File uploaded successfully", file: req.file });
}) as express.RequestHandler;

router.post(
  "/novels/uploadFIle",
  upload.single("file"),
  handleFileUpload
);

export default router;