# Phase 2 - Authentication & Role Management Flow

## 📋 Overview

Phase 2 implements user authentication, registration with OTP verification, login, and profile management with role-based access control.

---

## 🎯 Objectives

- ✅ User registration with OTP email verification
- ✅ Login for Admin, Agent, and Customer
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ User profile management

---

## 🔄 Complete Authentication Flow

### **1. Customer Registration Flow**

```
Step 1: Send OTP
POST /api/auth/register/send-otp
Body: {
    "email": "customer@example.com",
    "role": "customer"
}

Step 2: Verify OTP & Register
POST /api/auth/register/verify-otp
Body: {
    "email": "customer@example.com",
    "otp": "123456",
    "password": "Password123!",
    "name": "John Doe",
    "role": "customer"
}

Response: {
    "token": "jwt_token_here",
    "user": { ... }
}
```

---

### **2. Agent Registration Flow**

```
Step 1: Send OTP
POST /api/auth/register/send-otp
Body: {
    "email": "agent@example.com",
    "role": "agent"
}

Step 2: Verify OTP & Register
POST /api/auth/register/verify-otp
Body: {
    "email": "agent@example.com",
    "otp": "123456",
    "password": "Password123!",
    "name": "Jane Agent",
    "role": "agent"
}
```

---

### **3. Login Flow**

```
POST /api/auth/login
Body: {
    "email": "user@example.com",
    "password": "Password123!",
    "role": "customer" | "agent" | "admin"
}

Response: {
    "token": "jwt_token_here",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "role_name": "customer",
        ...
    }
}
```

**Save the token** for authenticated requests!

---

### **4. Get Profile**

```
GET /api/auth/profile
Headers: {
    "Authorization": "Bearer <token>"
}

Response: {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role_name": "customer",
    ...
}
```

---

## 📝 Step-by-Step Testing

### **Test 1: Customer Registration**

1. **Send OTP:**
   ```bash
   POST /api/auth/register/send-otp
   {
       "email": "customer@example.com",
       "role": "customer"
   }
   ```
   - Check email for OTP code
   - Expected: `200 OK` with OTP sent message

2. **Verify OTP:**
   ```bash
   POST /api/auth/register/verify-otp
   {
       "email": "customer@example.com",
       "otp": "123456",
       "password": "Password123!",
       "name": "John Doe",
       "role": "customer"
   }
   ```
   - Expected: `200 OK` with token and user data
   - **Save the token** as `customer_token`

---

### **Test 2: Agent Registration**

1. **Send OTP:**
   ```bash
   POST /api/auth/register/send-otp
   {
       "email": "agent@example.com",
       "role": "agent"
   }
   ```

2. **Verify OTP:**
   ```bash
   POST /api/auth/register/verify-otp
   {
       "email": "agent@example.com",
       "otp": "123456",
       "password": "Password123!",
       "name": "Jane Agent",
       "role": "agent"
   }
   ```
   - **Save the token** as `agent_token`

---

### **Test 3: Login**

**Customer Login:**
```bash
POST /api/auth/login
{
    "email": "customer@example.com",
    "password": "Password123!",
    "role": "customer"
}
```

**Agent Login:**
```bash
POST /api/auth/login
{
    "email": "agent@example.com",
    "password": "Password123!",
    "role": "agent"
}
```

**Admin Login:**
```bash
POST /api/auth/login
{
    "email": "admin@example.com",
    "password": "Password123!",
    "role": "admin"
}
```

---

### **Test 4: Get Profile**

```bash
GET /api/auth/profile
Headers: {
    "Authorization": "Bearer <token>"
}
```

**Expected:** User profile data

---

## 🔐 Authentication Headers

All protected routes require:

```
Authorization: Bearer <jwt_token>
```

**Example:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 👥 User Roles

1. **Customer** (`role: "customer"`)
   - Can create tickets
   - Can view own tickets
   - Can use live chat

2. **Agent** (`role: "agent"`)
   - Can view assigned tickets
   - Can reply to tickets
   - Can manage live chats
   - Can access knowledge base

3. **Admin** (`role: "admin"`)
   - Full system access
   - Can manage all tickets
   - Can manage knowledge base
   - Can manage users

---

## ✅ Success Criteria

- [ ] OTP sent successfully via email
- [ ] Registration completes with token
- [ ] Login returns JWT token
- [ ] Profile endpoint works with token
- [ ] Invalid token returns 401
- [ ] Role-based access works

---

## 🔧 Environment Variables

**Required for Email (OTP):**
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER` (or `ADMIN_EMAIL`)
- `EMAIL_PASS` (or `ADMIN_EMAIL_PASSWORD`)

**Required for JWT:**
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (default: 1d)

---

## 🚀 Next Phase

After Phase 2 is complete, proceed to:
- **Phase 3:** Ticketing System

---

## 📊 Token Usage

**Save tokens in Postman environment:**
- `customer_token` - For customer requests
- `agent_token` - For agent requests
- `admin_token` - For admin requests

**Token expires in:** 1 day (configurable via `JWT_EXPIRES_IN`)

---

**Phase 2 enables secure authentication for all users! ✅**

