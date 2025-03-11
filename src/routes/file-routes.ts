import express, { Request, Response, Router } from "express";
import multer from "multer";
import path from "path";

const router: Router = Router();

// 使用内存存储而不是磁盘存储
const storage = multer.memoryStorage();

const upload = multer({ storage });

// 使用类型断言强制突破类型检查
const handleFileUpload = ((req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // 从内存中处理文件
  const fileInfo = { ...req.file };
  
  // 修正文件名编码
  fileInfo.originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  
  // 由于使用内存存储，文件内容在 buffer 属性中
  console.log(`接收到文件: ${fileInfo.originalname}, 大小: ${fileInfo.size} 字节`);
  
  // 在实际应用中，你可能需要将文件上传到S3或其他云存储
  // 这里我们只返回文件信息
  res.status(200).json({ 
    message: "File uploaded successfully", 
    file: {
      originalName: fileInfo.originalname,
      size: fileInfo.size,
      mimeType: fileInfo.mimetype,
      // 你可以选择不返回buffer内容，它可能很大
      // buffer: fileInfo.buffer.toString('base64') 
    }
  });
}) as express.RequestHandler;

router.post(
  "/novels/upload",
  upload.single("file"),
  handleFileUpload
);

export default router;