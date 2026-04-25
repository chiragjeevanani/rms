const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage to process image before saving
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
  }
});

// Middleware to process image: Convert to WebP and save locally
const processImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const uploadPath = path.join(__dirname, '../uploads', fileName);

    // Convert to webp using sharp
    await sharp(req.file.buffer)
      .webp({ quality: 80 })
      .toFile(uploadPath);

    // Replace file object with local path information
    req.file.path = `/uploads/${fileName}`;
    req.file.filename = fileName;
    
    next();
  } catch (error) {
    console.error('Sharp processing error:', error);
    res.status(500).json({ message: 'Error processing image' });
  }
};

module.exports = { upload, processImage };
