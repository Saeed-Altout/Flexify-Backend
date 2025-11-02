# Auth DTOs Directory (`dtos/auth/`)

This directory contains Data Transfer Objects (DTOs) specific to authentication and authorization functionality.

## 🎯 Purpose

This directory holds DTOs for:
- **Login**: User login request validation
- **Registration**: User registration validation
- **Password Reset**: Password reset request/confirmation
- **Token Refresh**: Refresh token validation
- **OTP Verification**: Two-factor authentication DTOs

## 💡 Typical DTOs

### Login DTO
```typescript
// login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

### Register DTO
```typescript
// register.dto.ts
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
```

### Password Reset DTO
```typescript
// reset-password.dto.ts
export class ResetPasswordDto {
  @IsEmail()
  email: string;
}

export class ConfirmResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
```

## 📝 Usage

Use these DTOs in authentication controllers:
```typescript
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}

@Post('register')
async register(@Body() registerDto: RegisterDto) {
  return this.authService.register(registerDto);
}
```

## 🚀 Best Practices

- **Validation**: Use strong validation rules
- **Security**: Never include sensitive data in response DTOs
- **Consistency**: Follow naming conventions
- **Documentation**: Document each DTO's purpose

