# Backend Environment Variables

Copy this content to your `.env` file and fill in your actual values.

## Required Variables

```env
# Application Configuration
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_NAME=flexify_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_this_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_email_password_or_app_password
MAIL_FROM=noreply@flexify.com
```

## Optional Variables

```env
# Database (Optional)
# DB_SCHEMA=public
# DB_SSL_MODE=require
# DB_URL=postgresql://postgres:password@localhost:5432/flexify_db

# File Upload (Optional)
# MULTER_DESTINATION=./uploads/gallery
# MULTER_MAX_FILE_SIZE=52428800
# MULTER_MAX_FILES=10

# Rate Limiting (Optional)
# THROTTLE_TTL=60000
# THROTTLE_LIMIT=10

# CORS Configuration (Currently hardcoded in main.ts)
# Note: CORS origin is currently set to ['http://localhost:3001']
# Consider making it configurable via environment variable in production
# CORS_ORIGIN=http://localhost:3001,https://yourdomain.com
```

## Variable Descriptions

### Application Configuration

- **NODE_ENV**: Node environment (`development`, `production`, or `test`)
- **PORT**: Server port (default: `3000`)
- **BASE_URL**: Base URL of the application (optional)
- **FRONTEND_URL**: Frontend URL (required for CORS and email links)

### Database Configuration

- **DB_HOST**: Database host (default: `localhost`)
- **DB_PORT**: Database port (default: `5432`)
- **DB_USER**: Database username
- **DB_PASSWORD**: Database password
- **DB_NAME**: Database name
- **DB_SCHEMA**: Database schema (optional)
- **DB_SSL_MODE**: SSL mode for database connection (optional: `require`, `disable`, etc.)
- **DB_URL**: Complete database URL (optional, alternative to individual DB\_\* variables)

### JWT Configuration

- **JWT_SECRET**: Secret key for JWT access tokens (generate with: `openssl rand -base64 32`)
- **JWT_REFRESH_SECRET**: Secret key for JWT refresh tokens (generate with: `openssl rand -base64 32`)
- **JWT_EXPIRES_IN**: Access token expiration (e.g., `15m`, `1h`, `7d`)
- **JWT_REFRESH_EXPIRES_IN**: Refresh token expiration (e.g., `7d`, `30d`)

### Email Configuration

- **MAIL_HOST**: SMTP server host (e.g., `smtp.gmail.com`, `smtp.mailtrap.io`)
- **MAIL_PORT**: SMTP server port (`587` for TLS, `465` for SSL)
- **MAIL_USER**: SMTP username (usually your email address)
- **MAIL_PASS**: SMTP password (use app-specific password for Gmail)
- **MAIL_FROM**: Email sender address

### File Upload Configuration

- **MULTER_DESTINATION**: Directory for uploaded files (default: `./uploads/gallery`)
- **MULTER_MAX_FILE_SIZE**: Maximum file size in bytes (default: `52428800` = 50MB)
- **MULTER_MAX_FILES**: Maximum number of files per upload (default: `10`)

### Rate Limiting Configuration

- **THROTTLE_TTL**: Time-to-live in milliseconds (default: `60000` = 1 minute)
- **THROTTLE_LIMIT**: Maximum requests per time window (default: `10`)

## Security Notes

- Never commit `.env` file to version control
- Use strong, random secrets in production
- Rotate secrets regularly
- Use environment-specific values for different environments
- Consider using a secrets management service in production
