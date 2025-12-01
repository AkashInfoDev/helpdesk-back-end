# Authentication Guide - Registration & Login

## 📋 Overview

This guide explains how to register and login for Customer, Agent, and Admin users.

---

## 🔐 Authentication Flow

### For Customers & Agents:
1. **Step 1:** Send OTP to email
2. **Step 2:** Verify OTP and create account
3. **Login:** Use email and password

### For Admin:
- Admin accounts are created separately (not via registration)
- Use login endpoint with admin credentials

---

## 📝 Step-by-Step Instructions

### 1. Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select `AUTHENTICATION_POSTMAN_COLLECTION.json`
4. Create/Select an environment
5. Set environment variable: `base_url = http://localhost:5000`

---

## 👤 Customer Registration

### Step 1: Send OTP
```
POST /api/auth/register/send-otp
Body:
{
    "name": "John Doe",
    "email": "customer@example.com",
    "password": "CustomerPassword123!",
    "role": "customer"
}
```

**Expected Response:**
```json
{
    "message": "OTP sent successfully",
    "email": "customer@example.com"
}
```

**Action:** Check your email for the 6-digit OTP code (valid for 10 minutes)

### Step 2: Verify OTP & Create Account
```
POST /api/auth/register/verify-otp
Body:
{
    "name": "John Doe",
    "email": "customer@example.com",
    "password": "CustomerPassword123!",
    "role": "customer",
    "otp": "123456"  // Replace with actual OTP from email
}
```

**Expected Response:**
```json
{
    "message": "Account created successfully",
    "user": {
        "id": 1,
        "email": "customer@example.com",
        "role": "customer"
    }
}
```

---

## 👨‍💼 Agent Registration

### Step 1: Send OTP
```
POST /api/auth/register/send-otp
Body:
{
    "name": "Jane Smith",
    "email": "agent@example.com",
    "password": "AgentPassword123!",
    "role": "agent"
}
```

**Expected Response:**
```json
{
    "message": "OTP sent successfully",
    "email": "agent@example.com"
}
```

**Action:** Check your email for the 6-digit OTP code

### Step 2: Verify OTP & Create Account
```
POST /api/auth/register/verify-otp
Body:
{
    "name": "Jane Smith",
    "email": "agent@example.com",
    "password": "AgentPassword123!",
    "role": "agent",
    "otp": "123456"  // Replace with actual OTP from email
}
```

**Expected Response:**
```json
{
    "message": "Account created successfully",
    "user": {
        "id": 2,
        "email": "agent@example.com",
        "role": "agent"
    }
}
```

---

## 🔑 Login

### Customer Login
```
POST /api/auth/login
Body:
{
    "email": "customer@example.com",
    "password": "CustomerPassword123!",
    "role": "customer"
}
```

**Expected Response:**
```json
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "customer@example.com",
        "role": "customer",
        "role_name": "customer"
    }
}
```

**Action:** Copy the `token` and save it as `customer_token` in Postman environment

---

### Agent Login
```
POST /api/auth/login
Body:
{
    "email": "agent@example.com",
    "password": "AgentPassword123!",
    "role": "agent"
}
```

**Expected Response:**
```json
{
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 2,
        "name": "Jane Smith",
        "email": "agent@example.com",
        "role": "agent",
        "role_name": "agent"
    }
}
```

**Action:** Copy the `token` and save it as `agent_token` in Postman environment

---

### Admin Login

**⚠️ Important:** Admin account must be created first!

#### Create Admin Account

Run this command in your project root:
```bash
node create_admin.js
```

Or set environment variables in `.env`:
```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Password123!
ADMIN_NAME=Admin
```

Then run:
```bash
node create_admin.js
```

**Default Admin Credentials** (if using defaults):
- Email: `admin@example.com`
- Password: `Password123!`

#### Login as Admin
```
POST /api/auth/login
Body:
{
    "email": "admin@example.com",
    "password": "Password123!",
    "role": "admin"
}
```

**Expected Response:**
```json
{
    "message": "Admin login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
        "id": 1,
        "name": "Admin",
        "email": "admin@example.com",
        "role": "admin",
        "role_name": "admin"
    }
}
```

**Action:** Copy the `token` and save it as `admin_token` in Postman environment

---

## 👤 Get Profile

After login, you can get your profile:

```
GET /api/auth/profile
Headers:
    Authorization: Bearer {your_token}
```

**Expected Response:**
```json
{
    "id": 1,
    "email": "customer@example.com",
    "role_name": "customer",
    ...
}
```

---

## 🧪 Quick Test Flow

1. **Create Customer:**
   - Send OTP → Check email → Verify OTP
   - Login → Save token

2. **Create Agent:**
   - Send OTP → Check email → Verify OTP
   - Login → Save token

3. **Create Admin:**
   - Run `node create_admin.js`
   - Login → Save token

4. **Test Profile:**
   - Use saved token to get profile

---

## 📋 Postman Collection Features

The collection includes:
- ✅ Automatic token saving to environment variables
- ✅ Test scripts to verify responses
- ✅ Pre-filled sample data
- ✅ Clear descriptions for each endpoint

### Environment Variables Auto-Set:
- `customer_token` - Set after customer login
- `agent_token` - Set after agent login
- `admin_token` - Set after admin login
- `customer_email` - Set after sending OTP
- `agent_email` - Set after sending OTP

---

## ⚠️ Common Issues

### Issue: "Email already registered"
**Solution:** Use a different email or login with existing account

### Issue: "Invalid OTP"
**Solution:** 
- Check email for correct OTP
- OTP expires after 10 minutes
- Each OTP can only be used once

### Issue: "OTP expired"
**Solution:** Request a new OTP by calling send-otp again

### Issue: "Invalid admin credentials"
**Solution:** 
- Ensure admin account exists (run `create_admin.js`)
- Check email and password are correct
- Verify role is set to "admin" in login request

### Issue: "Role mismatch"
**Solution:** Ensure the role in login request matches the user's actual role

---

## 🔒 Security Notes

1. **OTP Expiration:** OTPs expire after 10 minutes
2. **OTP Single Use:** Each OTP can only be used once
3. **Password:** Use strong passwords in production
4. **Token:** Tokens are JWT and expire based on `JWT_EXPIRES_IN` env variable
5. **HTTPS:** Use HTTPS in production

---

## 📝 Sample Test Users

### Customer 1
- Email: `customer1@example.com`
- Password: `Customer123!`
- Role: `customer`

### Agent 1
- Email: `agent1@example.com`
- Password: `Agent123!`
- Role: `agent`

### Admin
- Email: `admin@example.com`
- Password: `Password123!`
- Role: `admin`

---

## ✅ Next Steps

After successful authentication:
1. Use the tokens in Phase 5 API collection
2. Test all Phase 5 endpoints
3. Set agent status to "online" to receive chats
4. Start testing live chat features

---

**Happy Testing! 🚀**

