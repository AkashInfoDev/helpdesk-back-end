# Quick Start Guide - Production Ready Setup

## 🚀 Quick Setup (5 Minutes)

### **Step 1: Install Dependencies**

```bash
npm install
```

This installs:
- express-rate-limit (rate limiting)
- express-validator (input validation)
- winston (structured logging)

---

### **Step 2: Create .env File**

Create a `.env` file in the project root with these **minimum required** variables:

```env
# Server
NODE_ENV=development
PORT=5000

# Database (REQUIRED)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=helpdesk_db
DB_USER=root
DB_PASSWORD=your_password

# JWT (REQUIRED)
JWT_SECRET=your_secret_key_at_least_32_characters

# CORS (REQUIRED)
ALLOWED_ORIGINS=http://localhost:3000
```

**See `ENV_EXAMPLE.md` for all available options.**

---

### **Step 3: Create Logs Directory**

```bash
mkdir logs
```

---

### **Step 4: Start Server**

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

---

## ✅ What's New (Production Features)

### **1. Environment Validation**
- ✅ Validates required variables on startup
- ✅ Shows warnings for misconfigurations
- ✅ Sets defaults for optional variables

### **2. CORS Security**
- ✅ Only allows specified origins
- ✅ Configurable via `ALLOWED_ORIGINS`
- ✅ Works for both REST API and Socket.IO

### **3. Rate Limiting**
- ✅ API: 100 requests per 15 minutes
- ✅ Auth: 5 requests per 15 minutes
- ✅ Configurable via environment variables

### **4. Error Handling**
- ✅ Centralized error handling
- ✅ Proper error responses
- ✅ Hides stack traces in production

### **5. Structured Logging**
- ✅ Winston logger with file rotation
- ✅ Separate error and combined logs
- ✅ Console logging in development

### **6. Health Check**
- ✅ `/health` endpoint
- ✅ Database connection check
- ✅ Uptime information

### **7. Graceful Shutdown**
- ✅ Proper cleanup on shutdown
- ✅ Closes database connections
- ✅ Prevents data loss

---

## 🔧 Configuration

### **Development (.env):**
```env
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### **Production (.env):**
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
JWT_SECRET=very_strong_secret_at_least_32_characters
```

---

## 📝 Testing

### **1. Test Server Starts:**
```bash
npm start
```

Should see:
```
✅ Database connected
🔁 Database synced (alter mode)  # Only in development
✅ Roles seeded successfully
🚀 Server running on port 5000
⚡ Socket.IO active and running
```

### **2. Test Health Check:**
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "...",
  "uptime": 123.45
}
```

### **3. Test CORS:**
- ✅ Requests from allowed origins work
- ❌ Requests from blocked origins are rejected

### **4. Test Rate Limiting:**
- Make 100+ requests quickly
- Should get rate limit error after limit

---

## 🐛 Troubleshooting

### **Error: "Missing required environment variables"**
**Solution:** Check your `.env` file has all required variables (see Step 2)

### **Error: "CORS blocked origin"**
**Solution:** Add your origin to `ALLOWED_ORIGINS` in `.env`

### **Error: "Database connection failed"**
**Solution:** 
- Check MySQL is running
- Verify database credentials in `.env`
- Test connection: `mysql -u root -p`

### **Error: "Cannot find module 'winston'"**
**Solution:** Run `npm install` to install new dependencies

### **Logs not created:**
**Solution:** Create `logs` directory: `mkdir logs`

---

## 📊 Logs Location

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

---

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Create `.env` file
3. ✅ Create `logs` directory
4. ✅ Start server
5. ✅ Test endpoints
6. ✅ Deploy to production (see `PRODUCTION_DEPLOYMENT_GUIDE.md`)

---

**Your application is now production-ready! 🚀**

