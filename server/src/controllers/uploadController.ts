import { Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { AuthRequest } from '../middlewares/authMiddleware';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

export const uploadMenuImage = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    // 1. File Type Validation
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid file format. Only JPG, JPEG, PNG, and WEBP formats are allowed.',
      });
    }

    // 2. File Size Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        error: 'Image file size exceeds the 5MB limit.',
      });
    }

    // 3. Configure Cloudinary
    const cloudinaryClient = getCloudinaryConfig();
    if (!cloudinaryClient) {
      return res.status(500).json({
        error: 'Cloudinary storage is not configured. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
      });
    }

    // 4. Upload Buffer to Cloudinary
    const uploadStreamPromise = new Promise<{ imageUrl: string }>((resolve, reject) => {
      const stream = cloudinaryClient.uploader.upload_stream(
        {
          folder: 'yazhisai-cloud-kitchen/menu',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary upload failed with empty result'));
          }
          resolve({ imageUrl: result.secure_url || result.url });
        }
      );

      stream.end(file.buffer);
    });

    const { imageUrl } = await uploadStreamPromise;

    console.log(`📸 [Cloudinary Upload] Image uploaded successfully for Admin ${req.admin?.email || 'admin'}: ${imageUrl}`);

    return res.status(200).json({ imageUrl });
  } catch (error: any) {
    console.error('❌ [Cloudinary Upload Error]:', error);
    return res.status(500).json({
      error: error.message || 'Failed to upload image to Cloudinary.',
    });
  }
};
