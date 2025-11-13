# Authentication Module

This module implements session-based authentication using secure tokens stored in the database.

## Features

- **Login**: Authenticate users with email/password and create a session
- **Session Management**: Secure token-based sessions stored in database
- **Session Verification**: Middleware/Guard to protect routes
- **Logout**: Revoke sessions (single or all user sessions)
- **Cookie Support**: HttpOnly cookies for secure token storage
- **Authorization Header Support**: Bearer token support for API clients

## Database Schema

### Users Table
- Stores user credentials and profile information
- Supports email/password and OAuth providers
- Tracks email/phone verification status

### Sessions Table
- Stores active user sessions
- Tracks IP address, user agent, and device information
- Supports session expiration and revocation

## API Endpoints

### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
- Sets `session_token` cookie (HttpOnly)
- Returns user information

### POST `/api/auth/logout`
Logout and revoke current session.

**Headers:**
- `Authorization: Bearer <token>` OR
- Cookie: `session_token=<token>`

### GET `/api/auth/me`
Get current authenticated user information.

**Headers:**
- `Authorization: Bearer <token>` OR
- Cookie: `session_token=<token>`

### POST `/api/auth/verify`
Verify if session is valid.

**Headers:**
- `Authorization: Bearer <token>` OR
- Cookie: `session_token=<token>`

## Usage in Controllers

### Protecting Routes

Use the `SessionGuard` to protect routes:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('protected')
export class ProtectedController {
  @Get('profile')
  @UseGuards(SessionGuard)
  async getProfile(@CurrentUser() user: User) {
    return {
      success: true,
      data: { user },
    };
  }
}
```

### Accessing Current User

Use the `@CurrentUser()` decorator to get the authenticated user:

```typescript
@Get('my-data')
@UseGuards(SessionGuard)
async getMyData(@CurrentUser() user: User) {
  // user is automatically injected
  return user;
}
```

### Accessing Current Session

Use the `@CurrentSession()` decorator to get the current session:

```typescript
import { CurrentSession } from '../auth/decorators/current-session.decorator';
import { Session } from '../auth/entities/session.entity';

@Get('session-info')
@UseGuards(SessionGuard)
async getSessionInfo(@CurrentSession() session: Session) {
  return session;
}
```

## Environment Variables

- `SESSION_EXPIRES_IN`: Session expiration time (default: `7d`)
  - Format: `{number}{unit}` where unit is `d` (days), `h` (hours), `m` (minutes), or `s` (seconds)
  - Example: `7d`, `24h`, `30m`, `3600s`

## Session Token

The session token is:
- Generated using `crypto.randomUUID()`
- Stored in the `sessions` table
- Sent to client as HttpOnly cookie or in Authorization header
- Validated on each request
- Automatically refreshed (updated_at) on successful verification

## Security Features

1. **HttpOnly Cookies**: Prevents XSS attacks
2. **Secure Cookies**: Enabled in production
3. **Session Expiration**: Automatic expiration based on `expires_at`
4. **Session Revocation**: Support for revoking sessions
5. **IP Tracking**: Tracks IP address for security monitoring
6. **User Agent Tracking**: Tracks device information

