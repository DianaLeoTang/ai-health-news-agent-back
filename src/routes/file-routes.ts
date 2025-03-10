import express, { Request, Response, Router,RequestHandler } from "express";
import multer, { StorageEngine, FileFilterCallback } from "multer";
import path from "path";

const router: Router = Router();

// 配置存储方式
const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // 存储在 uploads 目录
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`); // 生成唯一文件名
  },
});

const upload = multer({ storage });

// 使用类型断言来解决类型不匹配问题
const handleFileUpload= ((req, res) => {
  console.log(req,'req这都有什么参数')
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log(req.file); // 输出文件信息
  res.status(200).json({ message: "File uploaded successfully", file: req.file });
})as express.RequestHandler;

router.post(
  "/novels/upload",
  upload.single("pdfFile"),
  handleFileUpload
);

export default router;