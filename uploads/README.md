# Uploads Directory (`uploads/`)

This directory stores files uploaded by users through the application.

## 📁 Structure

```
uploads/
├── avatars/      # User profile pictures
├── gallery/      # Gallery/images
└── documents/    # Document uploads (if exists)
```

## 🎯 Purpose

The uploads directory provides:
- **File Storage**: Centralized location for uploaded files
- **Organization**: Categorized storage by file type
- **Static Serving**: Files served as static assets
- **Backup Location**: Easy to backup user-uploaded content

## 💡 How It Works

### Static File Serving
Configured in `main.ts`:
```typescript
app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads/',
});
```

### File Access
Files are accessible via HTTP:
```
http://localhost:3000/uploads/avatars/user-123.jpg
http://localhost:3000/uploads/gallery/image-456.png
```

### Upload Handling
Files are uploaded using Multer (configured in `config/multer.config.ts`):
```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  // file.path contains the saved file path
  return { url: `/uploads/${file.filename}` };
}
```

## 📝 File Upload Examples

### Single File Upload
```typescript
import { Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Post('avatar')
@UseInterceptors(
  FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }),
)
uploadAvatar(@UploadedFile() file: Express.Multer.File) {
  return {
    url: `/uploads/avatars/${file.filename}`,
    size: file.size,
  };
}
```

### Multiple Files Upload
```typescript
import { FilesInterceptor } from '@nestjs/platform-express';

@Post('gallery')
@UseInterceptors(
  FilesInterceptor('images', 10, {
    dest: './uploads/gallery',
  }),
)
uploadGallery(@UploadedFiles() files: Express.Multer.File[]) {
  return files.map(file => ({
    url: `/uploads/gallery/${file.filename}`,
  }));
}
```

## 🚀 Best Practices

- **Validation**: Validate file types and sizes
- **Naming**: Use unique filenames (UUIDs, timestamps)
- **Security**: Scan files for malware/viruses
- **Storage Limits**: Implement storage quotas
- **Cleanup**: Remove orphaned files
- **Backup**: Regular backups of uploads directory
- **CDN**: Consider using CDN for production

## 🔒 Security Considerations

### File Type Validation
```typescript
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (!allowedMimeTypes.includes(file.mimetype)) {
  throw new BadRequestException('Invalid file type');
}
```

### File Size Limits
```typescript
const maxSize = 5 * 1024 * 1024; // 5MB
if (file.size > maxSize) {
  throw new BadRequestException('File too large');
}
```

### Filename Sanitization
```typescript
const sanitizedFilename = file.originalname
  .replace(/[^a-zA-Z0-9.-]/g, '')
  .replace(/\s+/g, '-');
```

## 📋 Directory Structure Guidelines

- **avatars/**: User profile pictures (square, small size)
- **gallery/**: General images and media files
- **documents/**: PDFs, documents (if applicable)
- **temp/**: Temporary uploads (cleanup regularly)

## 🗑️ Cleanup Strategy

Consider implementing:
- **Cron Job**: Periodic cleanup of old/temporary files
- **Database Tracking**: Track file references in database
- **Orphan Cleanup**: Remove files not referenced in database
- **Size Management**: Implement storage quotas and cleanup

