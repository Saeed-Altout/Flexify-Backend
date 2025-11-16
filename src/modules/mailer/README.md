# Mailer Module

This module handles all email sending functionality for the application.

## Email Templates

All email templates are located in `server/src/modules/mailer/templates/`:

1. **welcome.hbs** - Welcome email sent after registration with OTP
2. **verify-account.hbs** - Email verification with OTP
3. **password-reset.hbs** - Password reset email with link
4. **password-reset-confirmation.hbs** - Confirmation email after password reset

## Environment Variables Required

Make sure these are set in your `.env` file:

```env
MAIL_HOST=smtp.gmail.com          # Your SMTP server
MAIL_PORT=587                      # SMTP port (587 for TLS, 465 for SSL)
MAIL_USER=your-email@gmail.com    # SMTP username
MAIL_PASS=your-app-password        # SMTP password or app password
MAIL_FROM=noreply@flexify.com     # From email address
FRONTEND_URL=http://localhost:3001 # Frontend URL for reset links
```

## Gmail Setup Example

1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `MAIL_PASS`

## Email Services

- **sendWelcomeEmail** - Sends welcome email with 6-digit OTP after registration
- **sendVerificationEmail** - Sends verification email with OTP
- **sendPasswordResetEmail** - Sends password reset link
- **sendPasswordResetConfirmationEmail** - Sends confirmation after password reset

## OTP Generation

- OTPs are 6-digit numeric codes
- OTP expires in 10 minutes
- OTPs are stored in `email_verification_tokens` table

