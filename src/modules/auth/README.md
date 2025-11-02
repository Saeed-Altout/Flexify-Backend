# Auth Module (`modules/auth/`)

This module handles all authentication and authorization functionality.

## 📁 Typical Structure

```
auth/
├── auth.module.ts           # Module definition
├── auth.controller.ts      # Authentication endpoints
├── auth.service.ts          # Authentication business logic
├── strategies/              # Passport strategies
│   ├── jwt.strategy.ts      # JWT authentication strategy
│   └── local.strategy.ts    # Local (username/password) strategy
├── guards/                  # Auth-specific guards (if any)
└── dtos/                    # Auth-specific DTOs
    ├── login.dto.ts
    ├── register.dto.ts
    └── ...
```

## 🎯 Features

This module typically provides:
- **User Registration**: Create new user accounts
- **User Login**: Authenticate users with email/password
- **JWT Tokens**: Generate access and refresh tokens
- **Token Refresh**: Refresh expired access tokens
- **Password Reset**: Reset forgotten passwords
- **Email Verification**: Verify user email addresses
- **2FA/OTP**: Two-factor authentication (if implemented)

## 💡 Module Structure

### Auth Module
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: configService.get('JWT_SECRET'),
      signOptions: { expiresIn: '15m' },
    }),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### Auth Controller
```typescript
@Controller('auth')
export class AuthController {
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {}

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: User) {}
}
```

### Auth Service
```typescript
@Injectable()
export class AuthService {
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Hash password, create user, generate tokens
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // Validate credentials, generate tokens
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    // Validate user credentials
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    // Validate and generate new tokens
  }
}
```

## 📝 Endpoints

Typical authentication endpoints:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

## 🚀 Integration

This module integrates with:
- **JWT Module**: For token generation
- **Passport**: For authentication strategies
- **User Module**: If user management is separate
- **Mailer Module**: For email verification/password reset

## 🔒 Security Considerations

- **Password Hashing**: Use bcrypt with salt rounds
- **Token Expiration**: Short-lived access tokens, longer refresh tokens
- **HTTPS**: Always use HTTPS in production
- **Rate Limiting**: Limit login attempts
- **Token Storage**: Store tokens securely (httpOnly cookies recommended)

