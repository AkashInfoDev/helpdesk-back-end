# Environment Variables Example

Copy this content to a `.env` file in the project root and fill in your values.

```env
# ============================================
# Helpdesk Backend - Environment Variables
# ============================================

# ============================================
# Server Configuration
# ============================================
NODE_ENV=development
PORT=5000

# ============================================
# Database Configuration
# ============================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=helpdesk_db
DB_USER=root
DB_PASSWORD=your_password_here

# ============================================
# JWT Configuration
# ============================================
JWT_SECRET=your_very_strong_secret_key_here_change_in_production
JWT_EXPIRES_IN=1d

# ============================================
# CORS Configuration
# ============================================
# Comma-separated list of allowed origins
# For development: http://localhost:3000,http://localhost:3001
# For production: https://yourdomain.com,https://www.yourdomain.com
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# ============================================
# Email Configuration (for OTP)
# ============================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=noreply@yourdomain.com

# ============================================
# Admin Configuration (Optional)
# ============================================
# Used by create_admin.js script
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Password123!
ADMIN_NAME=Admin

# ============================================
# Rate Limiting (Optional)
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# Logging (Optional)
# ============================================
LOG_LEVEL=info
```

## Required Variables

These variables MUST be set:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`

## Optional Variables

These have defaults but can be customized:
- `PORT` (default: 5000)
- `NODE_ENV` (default: development)
- `JWT_EXPIRES_IN` (default: 1d)
- `ALLOWED_ORIGINS` (default: http://localhost:3000)
- `RATE_LIMIT_WINDOW_MS` (default: 900000 = 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` (default: 100)
- `LOG_LEVEL` (default: info)

## Production Notes

1. **JWT_SECRET**: Must be at least 32 characters and unique
2. **ALLOWED_ORIGINS**: Must be set to your production domain(s)
3. **NODE_ENV**: Must be set to `production`
4. **DB_PASSWORD**: Use strong password
5. **EMAIL_***: Configure for production email service

