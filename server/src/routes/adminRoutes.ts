import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middlewares/authMiddleware';
import { uploadMenuImage } from '../controllers/uploadController';

const router = Router();

// Configure Multer to store uploaded image buffers in memory (no disk writing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB Maximum File Size
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP formats are allowed.'));
    }
  },
});

// POST /api/admin/upload-image
router.post(
  '/upload-image',
  requireAdmin,
  (req, res, next) => {
    upload.single('image')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Image file size exceeds the 5MB limit.' });
        }
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message || 'File upload validation failed.' });
      }
      next();
    });
  },
  uploadMenuImage
);

export default router;
