# Phase 5 Testing Guide - Live Chat System

## 📋 Prerequisites

1. **Import Postman Collection**

   - Import `PHASE5_POSTMAN_COLLECTION.json` into Postman
   - Set up environment variables (see below)

2. **Environment Variables Setup**

   - Create a Postman Environment with these variables:
     ```
     base_url = http://localhost:5000
     customer_token = (will be set after login)
     agent_token = (will be set after login)
     admin_token = (will be set after login)
     ```

3. **Database Setup**
   - Ensure database is synced (run server once to auto-sync)
   - Have test users ready:
     - At least 1 Customer user
     - At least 2 Agent users
     - 1 Admin user

---

## 🔐 Step 1: Authentication Setup

### 1.1 Login as Customer

```
POST /api/auth/login
Body: {
  "email": "customer@example.com",
  "password": "password",
  "role": "customer"
}
```

- Copy the `token` from response
- Set `customer_token` in Postman environment

### 1.2 Login as Agent

```
POST /api/auth/login
Body: {
  "email": "agent@example.com",
  "password": "password",
  "role": "agent"
}
```

- Copy the `token` from response
- Set `agent_token` in Postman environment

### 1.3 Login as Admin

```
POST /api/auth/login
Body: {
  "email": "admin@example.com",
  "password": "password",
  "role": "admin"
}
```

- Copy the `token` from response
- Set `admin_token` in Postman environment

---

## 🧪 Step 2: Agent Availability Testing

### 2.1 Update Agent Status

**Test:** `PUT /api/agent-availability/my-status`

- Use `agent_token`
- Try different statuses: `"online"`, `"offline"`, `"busy"`, `"away"`
- **Expected:** Status updated successfully

### 2.2 Get My Status

**Test:** `GET /api/agent-availability/my-status`

- Use `agent_token`
- **Expected:** Returns agent status, active chats count, capacity info

### 2.3 Update Max Concurrent Chats

**Test:** `PUT /api/agent-availability/my-max-chats`

- Use `agent_token`
- Body: `{ "max_concurrent_chats": 5 }`
- **Expected:** Max chats updated

### 2.4 Update Agent Skills

**Test:** `PUT /api/agent-availability/my-skills`

- Use `agent_token`
- Body: `{ "skills": ["technical", "billing", "sales"] }`
- **Expected:** Skills updated

### 2.5 Get All Agents Status (Admin)

**Test:** `GET /api/agent-availability/all-agents`

- Use `admin_token`
- **Expected:** List of all agents with status and workload

---

## 💬 Step 3: Live Chat Session Testing

### 3.1 Start Chat Session (Customer)

**Test:** `POST /api/live-chat/start`

- Use `customer_token`
- Body:
  ```json
  {
    "subject": "Need help with my account",
    "priority": "medium",
    "required_skills": ["technical"],
    "metadata": {
      "browser": "Chrome",
      "page_url": "https://example.com/help"
    }
  }
  ```
- **Expected:**
  - Session created with `status: "pending"`
  - Chat appears in pending queue
  - All online agents notified
  - Customer context included in response
  - **Note:** No auto-assignment - agent must manually accept

### 3.2 Get My Sessions (Customer)

**Test:** `GET /api/live-chat/my-sessions`

- Use `customer_token`
- **Expected:** List of customer's chat sessions

### 3.3 Get Agent Sessions

**Test:** `GET /api/live-chat/agent/sessions?status=pending`

- Use `agent_token`
- Try different statuses: `pending`, `active`, `closed`
- **Expected:** List of sessions based on status
- **Note:** When `status=pending`, shows all pending chats in queue (not just assigned to agent)

### 3.4 Agent Accept Chat (Socket.IO)

**Test:** Socket.IO event `chat:accept`

- Use Socket.IO client with `agent_token`
- Emit: `socket.emit("chat:accept", { session_id: 1 }, callback)`
- **Expected:** 
  - Chat status changes to "active"
  - Agent assigned to chat
  - Customer and agent notified
  - Agent joins chat room

### 3.5 Get Session Messages

**Test:** `GET /api/live-chat/:id/messages`

- Use `agent_token` or `customer_token`
- Replace `:id` with actual session ID
- **Expected:** List of messages for the session

### 3.6 Get Customer Context

**Test:** `GET /api/live-chat/:id/customer-context`

- Use `agent_token`
- Replace `:id` with session ID
- **Expected:** Customer context with tickets, chats, account info

---

## 📤 Step 4: File Upload Testing

### 4.1 Upload Chat File

**Test:** `POST /api/chat-upload/upload`

- Use `agent_token` or `customer_token`
- Method: `POST` with `form-data`
- Fields:
  - `file`: Select an image/PDF/document file
  - `session_id`: Session ID number
- **Expected:**
  - File uploaded successfully
  - Returns file URL
  - File stored in `uploads/chat/` directory

### 4.2 Test File Types

- ✅ Images: JPEG, PNG, GIF, WebP
- ✅ PDFs
- ✅ Documents: DOC, DOCX, XLS, XLSX, TXT, CSV
- ❌ Other types should be rejected

### 4.3 Test File Size

- ✅ Files < 10MB should work
- ❌ Files > 10MB should be rejected

---

## 📝 Step 5: Canned Responses Testing

### 5.1 Create Canned Response

**Test:** `POST /api/canned-responses`

- Use `agent_token`
- Body:
  ```json
  {
    "title": "Greeting Message",
    "content": "Hello {{customer_name}}, thank you for contacting us!",
    "category": "greeting",
    "shortcut_key": "greeting",
    "is_shared": true
  }
  ```
- **Expected:** Canned response created with variables extracted

### 5.2 Get All Canned Responses

**Test:** `GET /api/canned-responses`

- Use `agent_token`
- Optional query params: `?category=greeting&search=hello`
- **Expected:** List of shared + own responses

### 5.3 Get by Shortcut

**Test:** `GET /api/canned-responses/shortcut/greeting`

- Use `agent_token`
- **Expected:** Response with shortcut "greeting"

### 5.4 Use Canned Response

**Test:** `POST /api/canned-responses/:id/use`

- Use `agent_token`
- Body:
  ```json
  {
    "variables": {
      "customer_name": "John Doe"
    }
  }
  ```
- **Expected:** Content with variables replaced

### 5.5 Update Canned Response

**Test:** `PUT /api/canned-responses/:id`

- Use `agent_token` (must be creator)
- **Expected:** Response updated

### 5.6 Delete Canned Response

**Test:** `DELETE /api/canned-responses/:id`

- Use `agent_token` (must be creator)
- **Expected:** Response deleted

---

## 🔄 Step 6: Queue Management Testing

### 6.1 Get Queue Statistics

**Test:** `GET /api/live-chat/queue/stats`

- Use `agent_token` or `admin_token`
- **Expected:** Queue stats with pending chats count, breakdown by priority

### 6.2 Manual Assign Chat (Admin)

**Test:** `POST /api/live-chat/:id/assign`

- Use `admin_token`
- Body: `{ "agent_id": 2 }`
- **Expected:** Chat assigned to specified agent

---

## 🔀 Step 7: Chat Transfer & Workload Testing

### 7.1 Transfer Chat

**Test:** `POST /api/live-chat/:id/transfer`
-
- Use `agent_token` (assigned agent) or `admin_token`
- Body:
  ```json
  {
    "to_agent_id": 3,
    "reason": "Need technical specialist"
  }
  ```
- **Expected:**
  - Chat transferred
  - Transfer history updated
  - System message created

### 7.2 Get Agent Workload

**Test:** `GET /api/live-chat/agent/:agent_id/workload`

- Use `agent_token` (own ID) or `admin_token`
- **Expected:**
  - Active chats count
  - Capacity utilization
  - List of active chats

### 7.3 Get All Agents Workload

**Test:** `GET /api/live-chat/admin/agents-workload`

- Use `admin_token`
- **Expected:** Workload for all agents with summary

---

## 🔌 Step 8: Socket.IO Testing (Real-time)

### 8.1 Setup Socket.IO Client

Use a Socket.IO client (browser console, Postman Socket.IO, or separate test script):

```javascript
const io = require("socket.io-client");

const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_TOKEN_HERE",
  },
});

socket.on("connect", () => {
  console.log("Connected!");
});
```

### 8.2 Test Socket Events

#### Customer Start Chat

```javascript
socket.emit(
  "chat:start",
  {
    subject: "Test chat",
    priority: "medium",
    required_skills: ["technical"],
  },
  (response) => {
    console.log("Session started:", response);
    // Response will have status: "pending"
    // Agent must manually accept
  }
);
```

#### Agent Accept Chat

```javascript
socket.emit(
  "chat:accept",
  {
    session_id: 1
  },
  (response) => {
    console.log("Chat accepted:", response);
    // Chat status changes to "active"
  }
);
```

#### Agent Update Status

```javascript
socket.emit(
  "agent:update_status",
  {
    availability_status: "online",
  },
  (response) => {
    console.log("Status updated:", response);
  }
);
```

#### Send Message

```javascript
socket.emit(
  "chat:send_message",
  {
    session_id: 1,
    type: "text",
    content: "Hello!",
  },
  (response) => {
    console.log("Message sent:", response);
  }
);
```

#### Send File Message

```javascript
socket.emit(
  "chat:send_message",
  {
    session_id: 1,
    type: "file",
    attachment_url: "/uploads/chat/file-123.jpg",
  },
  (response) => {
    console.log("File sent:", response);
  }
);
```

#### Use Canned Response

```javascript
socket.emit(
  "chat:use_canned_response",
  {
    session_id: 1,
    response_id: 1,
    variables: {
      customer_name: "John Doe",
    },
  },
  (response) => {
    console.log("Canned response used:", response);
  }
);
```

#### Transfer Chat

```javascript
socket.emit(
  "chat:transfer",
  {
    session_id: 1,
    to_agent_id: 3,
    reason: "Need specialist",
  },
  (response) => {
    console.log("Chat transferred:", response);
  }
);
```

#### Activity Ping

```javascript
socket.emit("agent:activity_ping");
```

#### Get All Agents Status

```javascript
socket.emit("agent:get_all_status", (response) => {
  console.log("All agents status:", response);
});
```

### 8.3 Listen to Socket Events

```javascript
// New session created
socket.on("chat:new_session", (session) => {
  console.log("New session:", session);
});

// Session assigned (when agent accepts or admin assigns)
socket.on("chat:session_assigned", (data) => {
  console.log("Session assigned:", data);
});

// New message
socket.on("chat:new_message", (message) => {
  console.log("New message:", message);
});

// Agent status changed
socket.on("agent:status_changed", (data) => {
  console.log("Agent status changed:", data);
});

// Chat transferred
socket.on("chat:transferred", (data) => {
  console.log("Chat transferred:", data);
});

// Typing indicator
socket.on("chat:typing", (data) => {
  console.log("User typing:", data);
});
```

---

## ✅ Testing Checklist

### Agent Availability

- [ ] Update status (online/offline/busy/away)
- [ ] Get my status with workload
- [ ] Update max concurrent chats
- [ ] Update skills
- [ ] Admin: Get all agents status
- [ ] Socket.IO: Status updates broadcast

### Live Chat Sessions

- [ ] Customer: Start chat session
- [ ] Customer: Get my sessions
- [ ] Agent: Get sessions (pending/active/closed)
- [ ] Get session messages
- [ ] Get customer context
- [ ] Convert chat to ticket
- [ ] Socket.IO: Real-time messaging

### File Upload

- [ ] Upload image file
- [ ] Upload PDF file
- [ ] Upload document file
- [ ] Test file size limit (10MB)
- [ ] Test invalid file types
- [ ] Socket.IO: Send file message

### Canned Responses

- [ ] Create canned response
- [ ] Get all responses
- [ ] Get by category/search
- [ ] Get by shortcut
- [ ] Use with variable substitution
- [ ] Update response
- [ ] Delete response
- [ ] Socket.IO: Use canned response

### Queue Management

- [ ] Get queue statistics
- [ ] Manual assign chat (Admin)
- [ ] View pending chats in queue
- [ ] Test priority sorting

### Chat Transfer & Workload

- [ ] Transfer chat to another agent
- [ ] Get agent workload
- [ ] Get all agents workload
- [ ] Test transfer history
- [ ] Socket.IO: Real-time transfer

### Customer Preload

- [ ] Customer context in session metadata
- [ ] Get customer context endpoint
- [ ] Previous tickets count
- [ ] Previous chats count
- [ ] Account information

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" Error

**Solution:** Check that token is set correctly in environment variables

### Issue: "Agent not available" Error

**Solution:** Ensure agent status is set to "online"

### Issue: File upload fails

**Solution:**

- Check file size < 10MB
- Check file type is allowed
- Ensure `uploads/chat/` directory exists

### Issue: Socket.IO connection fails

**Solution:**

- Check token is passed in `auth.token`
- Ensure server is running
- Check CORS settings

### Issue: Canned response variables not replaced

**Solution:** Ensure variables object keys match variable names in content (e.g., `{{customer_name}}`)

---

## 📊 Expected Results Summary

After completing all tests, you should have:

1. ✅ Agents can manage their availability status
2. ✅ Customers can start chat sessions (status: pending)
3. ✅ Agents manually accept chats from pending queue
4. ✅ Files can be uploaded and shared in chat
5. ✅ Canned responses work with variable substitution
6. ✅ Queue management functions properly
7. ✅ Chats can be transferred between agents
8. ✅ Workload statistics are accurate
9. ✅ Customer context is preloaded
10. ✅ All Socket.IO events work in real-time
11. ✅ Admin can manually assign chats to agents

---

## 🎯 Next Steps

After testing Phase 5:

1. Fix any bugs found during testing
2. Test edge cases (empty queues, no agents online, etc.)
3. Test with multiple concurrent users
4. Performance testing (load testing)
5. Move to Phase 6 (if applicable)

---

**Happy Testing! 🚀**
