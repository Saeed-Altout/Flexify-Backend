# Gallery Directory (`uploads/gallery/`)

This directory stores gallery images and media files uploaded by users.

## 🎯 Purpose

- **Image Storage**: Store user-uploaded images
- **Media Files**: General media file storage
- **Gallery Management**: Support for image galleries

## 💡 File Organization

Recommended organization patterns:

### By Date
```
gallery/
├── 2024/
│   ├── 01/
│   │   └── image-123.jpg
│   └── 02/
└── 2023/
```

### By User
```
gallery/
├── user-1/
│   └── image-123.jpg
└── user-2/
```

### By Project (if applicable)
```
gallery/
├── project-1/
│   └── image-123.jpg
└── project-2/
```

## 📝 Upload Example

```typescript
@Post('gallery')
@UseInterceptors(
  FilesInterceptor('images', 10, {
    storage: diskStorage({
      destination: './uploads/gallery',
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.originalname.split('.').pop()}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Invalid file type'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB per file
    },
  }),
)
uploadGallery(@UploadedFiles() files: Express.Multer.File[]) {
  return files.map(file => ({
    url: `/uploads/gallery/${file.filename}`,
    size: file.size,
    mimetype: file.mimetype,
  }));
}
```

## 🔒 Security Considerations

- **File Type Validation**: Restrict to specific image formats
- **Size Limits**: Set reasonable file size limits (5-10MB)
- **Quantity Limits**: Limit number of files per upload
- **Content Scanning**: Scan for inappropriate content
- **Access Control**: Verify user permissions

## 📐 Image Specifications

Common settings:
- **Max Dimensions**: Varies by use case (1920x1080 for general, higher for specific needs)
- **Max File Size**: 5-10MB per image
- **Allowed Formats**: JPG, PNG, GIF, WEBP
- **Compression**: Compress images to reduce storage

## 🚀 Best Practices

- **Image Optimization**: Compress and optimize images
- **Thumbnails**: Generate thumbnails for faster loading
- **Metadata**: Store image metadata in database
- **CDN Integration**: Use CDN for production
- **Storage Management**: Implement storage quotas
- **Cleanup**: Remove orphaned files periodically
- **Backup**: Regular backups of gallery content

## 📋 Database Tracking

Consider storing file references in database:
```typescript
@Entity('gallery_items')
export class GalleryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  url: string;

  @Column()
  size: number;

  @Column()
  mimetype: string;

  @ManyToOne(() => User)
  uploadedBy: User;

  @CreateDateColumn()
  uploadedAt: Date;
}
```

