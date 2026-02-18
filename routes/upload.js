 
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

/* =========================
   Cloudinary Configuration
========================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* =========================
   Ensure uploads folder
========================= */
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/* =========================
   Local Disk Storage for Other Types
========================= */
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const generalPath = path.join(uploadsDir, 'general');
    if (!fs.existsSync(generalPath)) {
      fs.mkdirSync(generalPath, { recursive: true });
    }
    cb(null, generalPath);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  }
});

/* ======================
   File Filter (FIXED)
========================= */
const fileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedPdf = 'application/pdf';

  if (allowedImages.includes(file.mimetype)) {
    cb(null, true);
  } else if (file.mimetype === allowedPdf) {
    cb(null, true);
  } else {
    cb(new Error('Only image or PDF files are allowed'), false);
  }
};

/* =========================
   Multer Config - Memory Storage for Cloudinary
========================= */
const memoryStorage = multer.memoryStorage();

const uploadToCloudinary = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// /* =========================
//    Multer Config - Local Storage for Other Types
// ========================= */
// const uploadToLocal = multer({
//   storage: localStorage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB
// });

/* =========================
   Upload Single File
========================= */
router.post('/single', auth, uploadToCloudinary.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Require exactly one type: only the field being uploaded (profile OR resume, not both)
    const type = typeof req.body.type === 'string' ? req.body.type.trim() : '';
    if (!type) {
      return res.status(400).json({ message: 'Missing upload type. Send type: "profile" or "resume".' });
    }
    if (type !== 'profile' && type !== 'resume' && type !== 'general' && type !== 'project' && type !== 'blog') {
      return res.status(400).json({ message: 'Invalid upload type. Use "profile", "resume", "general", "project", or "blog".' });
    }

    try {
      if (type === 'profile' || type === 'resume') {
        // Upload to Cloudinary
        const uploadOptions = {
          folder: type === 'profile' ? 'portfolio/profile' : 'portfolio/resume',
        };

        if (type === 'profile') {
          uploadOptions.transformation = [{ width: 500, height: 500, crop: 'limit' }];
        } else {
          // For resume (PDF), upload as Cloudinary "image" resource (PDF is supported there)
          // This generally opens in-browser more reliably than raw delivery.
          uploadOptions.resource_type = 'image';
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          uploadOptions.public_id = `resume-${unique}`;
        }

        // Convert buffer to data URI for Cloudinary
        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

        // Use Cloudinary's returned secure_url directly - it already has the correct version
        let fileUrl = result.secure_url;
        if (type === 'resume') {
          // For PDFs, result.secure_url already includes the correct version and format
          // No need to regenerate - just use what Cloudinary returns
          console.log('Resume uploaded to Cloudinary:', {
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: result.resource_type,
            version: result.version,
            format: result.format
          });
        }

        res.json({
          message: 'File uploaded successfully',
          filename: result.public_id,
          originalName: req.file.originalname,
          size: req.file.size,
          url: fileUrl,
          fullUrl: fileUrl,
          serverUrl: fileUrl,
          type: type
        });
      } else {
        // Local storage for project, blog, general
        let targetFolder = 'general';
        if (type === 'project') targetFolder = 'projects';
        if (type === 'blog') targetFolder = 'blog';

        const targetDir = path.join(uploadsDir, targetFolder);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Generate unique filename
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = `file-${unique}${path.extname(req.file.originalname)}`;
        const filePath = path.join(targetDir, filename);

        // Write buffer to file
        fs.writeFileSync(filePath, req.file.buffer);

        const fileUrl = `/uploads/${targetFolder}/${filename}`;
        const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;

        res.json({
          message: 'File uploaded successfully',
          filename: filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: fileUrl,
          fullUrl,
          serverUrl: fullUrl,
          type: targetFolder
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: error.message });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
});

/* =========================
   Delete File
========================= */
router.delete('/:type/:filename', auth, async (req, res) => {
  try {
    const { type, filename } = req.params;

    if (type === 'profile' || type === 'resume') {
      // Delete from Cloudinary
      try {
        // Decode URL-encoded filename (in case / is encoded as %2F)
        const decodedFilename = decodeURIComponent(filename);
        // Use the decoded filename if it includes folder path, otherwise construct it
        const publicId = decodedFilename.includes('/') ? decodedFilename : `portfolio/${type}/${decodedFilename}`;
        // Resume PDFs are uploaded as "image" resource_type (Cloudinary supports PDFs there)
        const resourceType = 'image';
        
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        
        if (result.result === 'not found') {
          return res.status(404).json({ message: 'File not found in Cloudinary' });
        }
        
        res.json({ message: 'File deleted successfully from Cloudinary' });
      } catch (error) {
        console.error('Cloudinary delete error:', error);
        res.status(500).json({ message: 'Failed to delete file from Cloudinary' });
      }
    } else {
      // Delete from local storage
      const filePath = path.join(uploadsDir, type, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   Multer Error Handler
========================= */
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large (max 5MB)' });
    }
  }
  res.status(400).json({ message: error.message });
});

module.exports = router;
