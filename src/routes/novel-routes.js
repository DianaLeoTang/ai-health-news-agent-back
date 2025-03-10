/*
 * @Author: Diana Tang
 * @Date: 2025-03-09 23:58:32
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /AI-Health-News-Agent-Back/src/routes/novel-routes.js
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const novelController = require('../controllers/novelController');
const { authenticateUser } = require('../middleware/auth');

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.id;
    const userDir = path.join(__dirname, '../uploads/pdfs', userId);
    
    fs.ensureDirSync(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('只接受PDF文件'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// 路由
router.post('/novels/upload', authenticateUser, upload.single('file'), novelController.uploadPdf);
router.get('/:id', authenticateUser, novelController.getNovelContent);
router.get('/:id/chapters/:chapterIndex', authenticateUser, novelController.getChapterContent);
router.post('/:id/progress', authenticateUser, novelController.updateReadingProgress);

module.exports = router;