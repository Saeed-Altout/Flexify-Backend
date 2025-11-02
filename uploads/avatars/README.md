# Avatars Directory (`uploads/avatars/`)

This directory stores user profile pictures (avatars).

## 🎯 Purpose

- **User Profile Images**: Store uploaded user avatar images
- **Profile Pictures**: Profile picture storage location
- **User Identity**: Visual representation of users

## 💡 File Naming Convention

Recommended naming patterns:
- **UUID-based**: `uuid-v4.jpg` - Most secure, prevents conflicts
- **Timestamp-based**: `timestamp-originalname.jpg` - Easy to debug
- **User ID-based**: `user-123.jpg` - Easy to identify owner

Example:
```typescript
filename: `${Date.now()}-${file.originalname}`
// Result: 1704067200000-avatar.jpg
```

## 📝 Upload Example

```typescript
@Post('avatar')
@UseInterceptors(
  FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const userId = req.user.id;
        const ext = file.originalname.split('.').pop();
        const filename = `user-${userId}-${Date.now()}.${ext}`;
        cb(null, filename);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only image files allowed'), false);
      },
    },
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB
    },
  }),
)
uploadAvatar(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: User) {
  // Update user avatar URL in database
  return { url: `/uploads/avatars/${file.filename}` };
}
```

## 🔒 Security Considerations

- **File Type Validation**: Only allow image formats (jpg, png, gif)
- **Size Limits**: Limit file size (typically 2-5MB)
- **Image Processing**: Resize images to standard dimensions
- **Virus Scanning**: Scan uploaded files for malware
- **Access Control**: Verify user has permission to upload

## 📐 Image Specifications

Recommended settings:
- **Max Dimensions**: 512x512 pixels
- **Max File Size**: 2MB
- **Allowed Formats**: JPG, PNG, GIF
- **Aspect Ratio**: 1:1 (square)

## 🚀 Best Practices

- **Resize Images**: Automatically resize to consistent dimensions
- **Generate Thumbnails**: Create smaller versions for lists
- **Cleanup**: Remove old avatars when new ones are uploaded
- **Default Avatar**: Provide default avatar for users without one
- **CDN**: Consider using CDN for production

