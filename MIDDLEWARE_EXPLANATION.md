# Middleware Explanation - Helpdesk Backend

## 📋 What is Middleware?

Middleware in Express.js are functions that execute **between** receiving a request and sending a response. They can:
- Execute code
- Modify request/response objects
- End the request-response cycle
- Call the next middleware in the stack

In this project, middleware is used for:
1. **Authentication** - Verify user is logged in
2. **Authorization** - Check user has correct role/permissions
3. **File Upload** - Handle file uploads (Multer)

---

## 🔐 1. Authentication Middleware (`authMiddleware.js`)

### **Purpose:**
Verifies that the user is authenticated (logged in) by checking JWT token.

### **What it does:**
1. Extracts JWT token from `Authorization` header
2. Verifies token using `JWT_SECRET`
3. Decodes token and attaches user data to `req.user`
4. Allows request to continue if valid, rejects if invalid

### **Code:**
```javascript
// Extracts: Bearer <token>
const token = req.headers.authorization?.split(" ")[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded; // Attach user info to request
```

### **Where it's used:**
- **All protected routes** (routes that require login)
- Examples:
  - `GET /api/auth/profile` - Get user profile
  - `POST /api/live-chat/start` - Start chat (customer only)
  - `GET /api/live-chat/agent/sessions` - Get agent sessions
  - `POST /api/canned-responses` - Create canned response
  - All file upload routes
  - All ticket routes
  - All KB article routes

### **Usage in routes:**
```javascript
const auth = require("../../middleware/authMiddleware");

// Protected route
router.get("/profile", auth, authController.getProfile);
router.post("/start", auth, role("customer"), chatController.startSession);
```

### **Response if unauthorized:**
- `401 Unauthorized` - No token or invalid token
- Message: "Unauthorized: No token provided" or "Unauthorized: Invalid token"

---

## 🛡️ 2. Role Middleware (`roleMiddleware.js`)

### **Purpose:**
Checks if the authenticated user has the required role(s) to access a route.

### **What it does:**
1. Gets user role from `req.user` (set by authMiddleware)
2. Resolves role ID to role name if needed
3. Checks if user role is in allowed roles list
4. Allows request if authorized, rejects if not

### **Code:**
```javascript
// Check if user role matches allowed roles
if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: "Access Denied" });
}
```

### **Where it's used:**
- **Role-based access control** on routes
- Examples:
  - Customer-only routes: `role("customer")`
  - Agent-only routes: `role("agent")`
  - Admin-only routes: `role("admin")`
  - Multiple roles: `role("agent", "admin")`

### **Usage in routes:**
```javascript
const role = require("../../middleware/roleMiddleware");

// Customer only
router.post("/start", auth, role("customer"), chatController.startSession);

// Agent only
router.get("/agent/sessions", auth, role("agent"), chatController.getAgentSessions);

// Admin only
router.get("/admin/all-sessions", auth, role("admin"), chatController.getAllSessions);

// Agent OR Admin
router.post("/:id/convert-to-ticket", auth, role("agent", "admin"), chatController.convertToTicket);
```

### **Response if unauthorized:**
- `403 Forbidden` - User doesn't have required role
- Message: "Access Denied: You do not have permission"

---

## 📤 3. File Upload Middleware

### **3.1 Chat Upload Middleware (`chatUpload.js`)**

#### **Purpose:**
Handles file uploads for chat messages (images, PDFs, documents).

#### **What it does:**
1. Configures Multer to save files to `uploads/chat/` directory
2. Validates file types (images, PDFs, documents)
3. Limits file size to 10MB
4. Generates unique filenames
5. Attaches file info to `req.file`

#### **Allowed file types:**
- **Images:** JPEG, PNG, GIF, WebP
- **PDFs:** PDF
- **Documents:** DOC, DOCX, XLS, XLSX, TXT, CSV

#### **Where it's used:**
- `POST /api/chat-upload/upload` - Upload file for chat

#### **Usage in routes:**
```javascript
const chatUpload = require("../../middleware/chatUpload");

router.post(
    "/upload",
    auth,
    chatUpload.single("file"), // Handle single file upload
    uploadChatFile
);
```

#### **File info in controller:**
```javascript
// In controller
req.file = {
    filename: "image-1234567890.jpg",
    path: "uploads/chat/image-1234567890.jpg",
    size: 1024000,
    mimetype: "image/jpeg"
}
```

---

### **3.2 Ticket Upload Middleware (`ticketUpload.js`)**

#### **Purpose:**
Handles file uploads for ticket attachments.

#### **What it does:**
1. Saves files to `uploads/tickets/` directory
2. Accepts **all file types** (no restriction)
3. Limits file size to 20MB
4. Generates unique filenames

#### **Where it's used:**
- Ticket attachment uploads (Phase 3)

#### **Usage in routes:**
```javascript
const ticketUpload = require("../../middleware/ticketUpload");

router.post(
    "/:id/attachments",
    auth,
    role("customer", "agent", "admin"),
    ticketUpload.array("files"), // Handle multiple files
    ticketAttachmentController.upload
);
```

---

### **3.3 KB Upload Middleware (`kbUpload.js`)**

#### **Purpose:**
Handles image uploads for Knowledge Base articles.

#### **What it does:**
1. Saves files to `uploads/kb/` directory
2. **Only allows images** (JPEG, PNG, GIF, WebP)
3. Limits file size to 5MB
4. Generates unique filenames

#### **Where it's used:**
- `POST /api/kb/upload` - Upload image for KB article

#### **Usage in routes:**
```javascript
const kbUpload = require("../../middleware/kbUpload");

router.post(
    "/upload",
    auth,
    role("admin"),
    kbUpload.single("image"),
    kbUploadController.upload
);
```

---

## 🔄 Middleware Execution Order

### **Example Route:**
```javascript
router.post(
    "/upload",
    auth,                    // 1. Check authentication
    role("agent"),           // 2. Check role (requires auth first)
    chatUpload.single("file"), // 3. Handle file upload
    uploadChatFile           // 4. Controller function
);
```

### **Execution Flow:**
```
Request → authMiddleware → roleMiddleware → chatUpload → Controller → Response
           ↓                ↓                ↓
        Check token    Check role      Save file
        Attach user    Allow/Deny      Attach file
```

---

## 📊 Middleware Usage Summary

| Middleware | Purpose | Used In | Response Codes |
|------------|---------|---------|----------------|
| `authMiddleware` | Verify JWT token | All protected routes | 401 Unauthorized |
| `roleMiddleware` | Check user role | Role-based routes | 403 Forbidden |
| `chatUpload` | Chat file uploads | Chat upload routes | 400 Bad Request (invalid file) |
| `ticketUpload` | Ticket attachments | Ticket routes | 400 Bad Request (invalid file) |
| `kbUpload` | KB article images | KB upload routes | 400 Bad Request (invalid file) |

---

## 🎯 Key Points

### **1. Middleware Chain:**
- Middleware executes in order
- Each middleware calls `next()` to continue
- If middleware doesn't call `next()`, request stops

### **2. Authentication First:**
- `authMiddleware` must come before `roleMiddleware`
- `roleMiddleware` needs `req.user` (set by `authMiddleware`)

### **3. File Upload:**
- Multer middleware handles file uploads
- Files are saved to disk before controller runs
- File info available in `req.file` or `req.files`

### **4. Error Handling:**
- Middleware can return errors directly
- No need to reach controller if middleware fails

---

## 📝 Example: Complete Route with All Middleware

```javascript
// Route definition
router.post(
    "/api/live-chat/:id/convert-to-ticket",
    auth,                          // 1. Must be logged in
    role("agent", "admin"),        // 2. Must be agent or admin
    ticketController.convertToTicket // 3. Execute controller
);

// Request flow:
// 1. Request arrives
// 2. authMiddleware checks token → sets req.user
// 3. roleMiddleware checks req.user.role → allows if agent/admin
// 4. Controller executes → converts chat to ticket
// 5. Response sent
```

---

## 🔍 Where Each Middleware is Used

### **authMiddleware:**
- ✅ All routes in `authRoutes.js` (except login/register)
- ✅ All routes in `liveChatRoutes.js`
- ✅ All routes in `ticketRoutes.js`
- ✅ All routes in `kbArticleRoutes.js`
- ✅ All routes in `cannedResponseRoutes.js`
- ✅ All routes in `agentAvailabilityRoutes.js`
- ✅ All routes in `chatUploadRoutes.js`

### **roleMiddleware:**
- ✅ Customer routes: `role("customer")`
- ✅ Agent routes: `role("agent")`
- ✅ Admin routes: `role("admin")`
- ✅ Shared routes: `role("agent", "admin")`

### **chatUpload:**
- ✅ `POST /api/chat-upload/upload`

### **ticketUpload:**
- ✅ `POST /api/tickets/:id/attachments`

### **kbUpload:**
- ✅ `POST /api/kb/upload`

---

## ✅ Summary

**Middleware in this project:**
1. **Protects routes** - Ensures only authenticated users access protected endpoints
2. **Enforces permissions** - Ensures users have correct role for specific actions
3. **Handles file uploads** - Processes and validates file uploads before controller

**Without middleware:**
- ❌ Anyone could access any route
- ❌ No file validation
- ❌ No security

**With middleware:**
- ✅ Secure API endpoints
- ✅ Role-based access control
- ✅ Validated file uploads
- ✅ Clean separation of concerns

---

**Middleware is the security layer of your API! 🔒**

