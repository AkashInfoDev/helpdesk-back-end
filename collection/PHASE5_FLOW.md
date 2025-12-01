# Phase 5 - Live Chat System Flow

## 📋 Overview

Phase 5 implements a complete live chat system with real-time communication, agent availability management, queue management, file sharing, canned responses, and chat-to-ticket conversion.

---

## 🎯 Objectives

- ✅ Real-time live chat (Socket.IO)
- ✅ Agent availability status management
- ✅ Manual chat assignment (no auto-assign)
- ✅ Chat queue management
- ✅ File sharing in chat
- ✅ Canned responses with variables
- ✅ Customer context/preload
- ✅ Chat-to-ticket conversion
- ✅ Chat transfer between agents

---

## 🔄 Complete Live Chat Flow

### **1. Agent Availability Management**

#### **Update Agent Status**
```
PUT /api/agent-availability/my-status
Headers: Authorization: Bearer <agent_token>
Body: {
    "availability_status": "online"  // online, offline, busy, away
}
```

**Status Options:**
- `online` - Available for chats
- `offline` - Not available
- `busy` - Currently busy
- `away` - Temporarily away

#### **Get My Status**
```
GET /api/agent-availability/my-status
Headers: Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "status": "online",
  "max_concurrent_chats": 5,
  "current_chats": 2,
  "skills": ["technical", "billing"]
}
```

#### **Update Max Concurrent Chats**
```
PUT /api/agent-availability/my-max-chats
Headers: Authorization: Bearer <agent_token>
Body: {
    "max_concurrent_chats": 5  // 1-20
}
```

#### **Update Skills**
```
PUT /api/agent-availability/my-skills
Headers: Authorization: Bearer <agent_token>
Body: {
    "skills": ["technical", "billing", "sales"]
}
```

---

### **2. Live Chat Session Flow**

#### **Step 1: Customer Starts Chat**
```
POST /api/live-chat/start
Headers: Authorization: Bearer <customer_token>
Body: {
    "subject": "Need help with account",
    "priority": "medium",
    "required_skills": ["technical"],
    "metadata": {
        "browser": "Chrome",
        "page_url": "https://example.com/help"
    }
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": 1,
    "status": "pending",
    "subject": "Need help with account",
    ...
  },
  "message": "Chat session created. Waiting for agent to accept.",
  "customer_context": {...}
}
```

**Important:** Chat is created with `status: "pending"` - agent must manually accept!

**Save `session.id` for subsequent requests!**

---

#### **Step 2: Agent Sees Pending Chat**

**Via Socket.IO (Real-time):**
- Agent receives `chat:new_session` event
- Shows in agent dashboard

**Via REST API:**
```
GET /api/live-chat/agent/sessions?status=pending
Headers: Authorization: Bearer <agent_token>
```

**Response:** List of pending chats

---

#### **Step 3: Agent Accepts Chat**

**Via Socket.IO (Real-time):**
```javascript
socket.emit("chat:accept", { session_id: 1 }, callback);
```

**Via REST API (Admin assigns):**
```
POST /api/live-chat/:id/assign
Headers: Authorization: Bearer <admin_token>
Body: {
    "agent_id": 3
}
```

**After acceptance:**
- Status changes to `active`
- Agent assigned to chat
- Customer and agent can now send messages

---

#### **Step 4: Get Session Messages**
```
GET /api/live-chat/:id/messages
Headers: Authorization: Bearer <token>
```

**Response:** All messages in the chat session

---

#### **Step 5: Get Customer Context**
```
GET /api/live-chat/:id/customer-context
Headers: Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "customer": {
    "id": 1,
    "name": "John Doe",
    "email": "customer@example.com",
    "account_age_days": 30
  },
  "previous_tickets_count": 5,
  "previous_chats_count": 2,
  "account_status": "active"
}
```

---

### **3. Queue Management**

#### **Get Queue Statistics**
```
GET /api/live-chat/queue/stats
Headers: Authorization: Bearer <agent_token>
```

**Response:**
```json
{
  "pending": 3,
  "active": 5,
  "closed": 10,
  "average_wait_time": 120
}
```

#### **Get Agent Workload**
```
GET /api/live-chat/agent/:agent_id/workload
Headers: Authorization: Bearer <token>
```

**Response:**
```json
{
  "agent_id": 3,
  "active_chats": 2,
  "max_concurrent_chats": 5,
  "available_slots": 3
}
```

#### **Get All Agents Workload (Admin)**
```
GET /api/live-chat/admin/agents-workload
Headers: Authorization: Bearer <admin_token>
```

---

### **4. Chat Transfer**

#### **Transfer Chat to Another Agent**
```
POST /api/live-chat/:id/transfer
Headers: Authorization: Bearer <agent_token>
Body: {
    "target_agent_id": 5,
    "reason": "Escalating to technical specialist"
}
```

**Features:**
- Transfers chat to another agent
- Records transfer history
- Notifies both agents and customer

---

### **5. Chat-to-Ticket Conversion**

#### **Convert Chat to Ticket**
```
POST /api/live-chat/:id/convert-to-ticket
Headers: Authorization: Bearer <agent_token>
Body: {
    "category_id": 1,
    "priority": "high",
    "subject": "Chat converted to ticket"
}
```

**Response:**
```json
{
  "message": "Chat converted to ticket successfully",
  "ticket": {
    "id": 10,
    "subject": "Chat converted to ticket",
    ...
  }
}
```

---

### **6. File Sharing**

#### **Upload Chat File**
```
POST /api/chat-upload/upload
Headers: Authorization: Bearer <token>
Body: form-data
  - file: [select file]
```

**Supported Files:**
- Images: JPEG, PNG, GIF, WebP
- PDFs
- Documents: DOC, DOCX, XLS, XLSX, TXT, CSV
- Max size: 10MB

**Response:**
```json
{
  "success": true,
  "file": {
    "filename": "image-1234567890.jpg",
    "url": "/uploads/chat/image-1234567890.jpg",
    "size": 1024000,
    "mimetype": "image/jpeg"
  }
}
```

**Use in Socket.IO message:**
```javascript
socket.emit("chat:send_message", {
    session_id: 1,
    type: "file",
    attachment_url: "/uploads/chat/image-1234567890.jpg"
});
```

---

### **7. Canned Responses**

#### **Create Canned Response**
```
POST /api/canned-responses
Headers: Authorization: Bearer <agent_token>
Body: {
    "title": "Greeting",
    "content": "Hello {{customer_name}}! How can I help you?",
    "category": "greetings",
    "shortcut_key": "greeting",
    "is_shared": true,
    "variables": ["customer_name"]
}
```

**Variable Support:**
- Use `{{variable_name}}` in content
- Variables are replaced when used
- Example: `{{customer_name}}`, `{{ticket_id}}`

#### **Get All Canned Responses**
```
GET /api/canned-responses
Headers: Authorization: Bearer <agent_token>
```

**Response:** Shared + own canned responses

#### **Get by Shortcut**
```
GET /api/canned-responses/shortcut/:shortcut
Headers: Authorization: Bearer <agent_token>
```

**Example:** `/api/canned-responses/shortcut/greeting`

#### **Use Canned Response**
```
POST /api/canned-responses/:id/use
Headers: Authorization: Bearer <agent_token>
Body: {
    "variables": {
        "customer_name": "John Doe"
    }
}
```

**Response:**
```json
{
  "content": "Hello John Doe! How can I help you?",
  "variables_replaced": true
}
```

---

## 📝 Step-by-Step Testing Flow

### **Complete Chat Lifecycle:**

1. **Agent Sets Status to Online:**
   ```bash
   PUT /api/agent-availability/my-status
   {
       "availability_status": "online"
   }
   ```

2. **Customer Starts Chat:**
   ```bash
   POST /api/live-chat/start
   {
       "subject": "Need help",
       "priority": "medium"
   }
   ```
   - Save `chat_session_id`
   - Status: `pending`

3. **Agent Views Pending Chats:**
   ```bash
   GET /api/live-chat/agent/sessions?status=pending
   ```

4. **Agent Accepts Chat (Socket.IO):**
   ```javascript
   socket.emit("chat:accept", { session_id: 1 });
   ```
   - Or Admin assigns via REST API

5. **Customer Sends Message (Socket.IO):**
   ```javascript
   socket.emit("chat:send_message", {
       session_id: 1,
       type: "text",
       content: "Hello agent!"
   });
   ```

6. **Agent Sends Message (Socket.IO):**
   ```javascript
   socket.emit("chat:send_message", {
       session_id: 1,
       type: "text",
       content: "Hello customer! How can I help?"
   });
   ```

7. **Agent Uses Canned Response:**
   ```bash
   POST /api/canned-responses/:id/use
   {
       "variables": {
           "customer_name": "John"
       }
   }
   ```

8. **Customer Uploads File:**
   ```bash
   POST /api/chat-upload/upload
   [Upload file]
   ```
   - Use returned URL in Socket.IO message

9. **Agent Views Customer Context:**
   ```bash
   GET /api/live-chat/:id/customer-context
   ```

10. **Agent Converts to Ticket:**
    ```bash
    POST /api/live-chat/:id/convert-to-ticket
    {
        "category_id": 1,
        "priority": "high"
    }
    ```

---

## 🔌 Socket.IO Events

### **Client → Server:**

| Event | Description | Used By |
|-------|-------------|---------|
| `chat:start` | Start new chat | Customer |
| `chat:accept` | Accept pending chat | Agent |
| `chat:join` | Join session room | Both |
| `chat:send_message` | Send message | Both |
| `chat:typing` | Typing indicator | Both |
| `chat:end` | End chat session | Both |
| `agent:update_status` | Update status | Agent |
| `agent:activity_ping` | Keep status active | Agent |

### **Server → Client:**

| Event | Description | Received By |
|-------|-------------|-------------|
| `chat:new_session` | New pending chat | Agent |
| `chat:session_assigned` | Chat assigned | Both |
| `chat:new_message` | New message | Both |
| `chat:typing` | User typing | Both |
| `chat:ended` | Chat ended | Both |
| `agent:status_changed` | Status updated | Agent |

---

## 🎯 Chat Status Flow

```
pending → active → closed
   ↓         ↓
  (wait)  (chatting)
```

1. **pending** - Customer started, waiting for agent
2. **active** - Agent accepted, chatting
3. **closed** - Chat ended

---

## ✅ Success Criteria

- [ ] Agent can update status
- [ ] Customer can start chat
- [ ] Agent sees pending chats
- [ ] Agent can accept chat
- [ ] Real-time messaging works
- [ ] File sharing works
- [ ] Canned responses work
- [ ] Chat transfer works
- [ ] Chat-to-ticket conversion works
- [ ] Customer context loads

---

## 🔧 Environment Variables

**File Upload:**
- Max file size: 10MB
- Storage: `uploads/chat/`
- Supported: Images, PDFs, Documents

**Socket.IO:**
- Port: Same as HTTP server (5000)
- CORS: Configured via `ALLOWED_ORIGINS`

---

## 🚀 Real-Time Communication

**For real-time chat, use Socket.IO:**
- See `socket-test/` folder for test clients
- See `PHASE5_WORKFLOW.md` for complete Socket.IO flow

**REST API is for:**
- Starting chats
- Viewing chat history
- Managing availability
- Queue management
- Canned responses

---

## 📋 Manual Assignment Flow

**Current Implementation:**
1. Customer starts chat → `status: "pending"`
2. All agents see pending chat notification
3. Agent manually accepts via Socket.IO or Admin assigns via REST
4. Chat becomes `active`
5. Real-time messaging begins

**No Auto-Assignment:**
- All chats start as `pending`
- Agents must manually accept
- Admin can manually assign

---

**Phase 5 provides complete real-time live chat capabilities! ✅**

