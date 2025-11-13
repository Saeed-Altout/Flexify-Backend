import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const multerConfig = {
  storage: diskStorage({
    destination: process.env.MULTER_DESTINATION || './uploads/gallery',
    filename: (req, file, callback) => {
      const uniqueSuffix = uuidv4();
      const fileExtension = extname(file.originalname);
      const filename = `${uniqueSuffix}${fileExtension}`;
      callback(null, filename);
    },
  }),
  fileFilter: (req, file, callback) => {
    // Define allowed file types
    const allowedMimes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Videos
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Invalid file type'), false);
    }
  },
  limits: {
    fileSize: parseInt(process.env.MULTER_MAX_FILE_SIZE || '52428800', 10), // Default 50MB
    files: parseInt(process.env.MULTER_MAX_FILES || '10', 10), // Default 10 files
  },
};
