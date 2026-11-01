import multer from 'multer';
import { Request } from 'express';
import { cloudinary } from '../config/cloudinary';

const mem = multer.memoryStorage();
const imgFilter = (_r: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only JPEG, PNG, WebP allowed'));
};

export const uploadPostImage = multer({ storage: mem, fileFilter: imgFilter,
  limits: { fileSize: 10*1024*1024, files: 1 } }).single('image');

export const uploadAvatar = multer({ storage: mem, fileFilter: imgFilter,
  limits: { fileSize: 5*1024*1024, files: 1 } }).single('avatar');

export function streamToCloudinary(
  buffer: Buffer, folder: string, transformation?: object
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const publicId = `post_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'image',
        allowed_formats: ['jpg','jpeg','png','webp'],
        transformation: transformation ?? [{ width:1200, height:675, crop:'fill', quality:'auto:good' }] },
      (err, result) => {
        if (err || !result) reject(err ?? new Error('Upload failed'));
        else resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    ).end(buffer);
  });
}
