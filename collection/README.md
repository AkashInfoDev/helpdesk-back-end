# Postman Collections & Flow Documentation

## 📋 Overview

This folder contains Postman collections and flow documentation for all 5 phases of the Helpdesk Backend project.

---

## 📁 Files

### **Phase 1 - Foundation & Setup**
- `PHASE1_POSTMAN_COLLECTION.json` - Postman collection
- `PHASE1_FLOW.md` - Flow documentation

### **Phase 2 - Authentication & Role Management**
- `PHASE2_POSTMAN_COLLECTION.json` - Postman collection
- `PHASE2_FLOW.md` - Flow documentation

### **Phase 3 - Ticketing System**
- `PHASE3_POSTMAN_COLLECTION.json` - Postman collection
- `PHASE3_FLOW.md` - Flow documentation

### **Phase 4 - Knowledge Base Management**
- `PHASE4_POSTMAN_COLLECTION.json` - Postman collection
- `PHASE4_FLOW.md` - Flow documentation

### **Phase 5 - Live Chat System**
- `PHASE5_POSTMAN_COLLECTION.json` - Postman collection
- `PHASE5_FLOW.md` - Flow documentation

---

## 🚀 How to Use

### **1. Import Postman Collections**

1. Open Postman
2. Click **Import**
3. Select the JSON collection file (e.g., `PHASE1_POSTMAN_COLLECTION.json`)
4. Repeat for all phases

### **2. Set Up Environment Variables**

Create a Postman environment with these variables:

```json
{
  "base_url": "http://localhost:5000",
  "customer_token": "",
  "agent_token": "",
  "admin_token": "",
  "otp": "",
  "ticket_id": "",
  "message_id": "",
  "category_id": "",
  "kb_category_id": "",
  "kb_article_id": "",
  "chat_session_id": "",
  "agent_id": "",
  "canned_response_id": ""
}
```

### **3. Follow Flow Documentation**

Each phase has a corresponding `*_FLOW.md` file that explains:
- Complete API flow
- Step-by-step testing
- Request/response examples
- Success criteria

---

## 📊 Collection Summary

### **Phase 1: Foundation & Setup**
- Health check endpoints
- Server status
- **Endpoints:** 2

### **Phase 2: Authentication**
- Registration (OTP)
- Login (Customer, Agent, Admin)
- Profile management
- **Endpoints:** 5

### **Phase 3: Ticketing**
- Ticket categories (CRUD)
- Tickets (CRUD)
- Ticket messages
- File attachments
- **Endpoints:** 12

### **Phase 4: Knowledge Base**
- KB categories (CRUD)
- KB articles (CRUD)
- Article search
- Article feedback
- Image uploads
- Version history
- **Endpoints:** 13

### **Phase 5: Live Chat**
- Agent availability
- Live chat sessions
- Queue management
- File uploads
- Canned responses
- Chat-to-ticket conversion
- **Endpoints:** 25

**Total Endpoints:** 57+

---

## 🔄 Testing Order

**Recommended testing order:**

1. **Phase 1** - Verify server is running
2. **Phase 2** - Register users and login (get tokens)
3. **Phase 3** - Test ticketing system
4. **Phase 4** - Test knowledge base
5. **Phase 5** - Test live chat

---

## 🔐 Authentication

**All protected endpoints require:**
```
Authorization: Bearer <token>
```

**Get tokens by:**
1. Registering users (Phase 2)
2. Logging in (Phase 2)

**Tokens are auto-saved** in Postman environment variables when using the collections.

---

## 📝 Notes

- **Base URL:** `http://localhost:5000` (change for production)
- **Real-time features:** Use Socket.IO (see `socket-test/` folder)
- **File uploads:** Use form-data in Postman
- **Environment variables:** Auto-populated by test scripts

---

## 🎯 Quick Start

1. **Import all collections** into Postman
2. **Create environment** with variables
3. **Start server:** `npm run dev`
4. **Test Phase 1:** Health check
5. **Test Phase 2:** Register and login
6. **Continue with Phase 3-5**

---

**All collections are ready for testing! 🚀**

