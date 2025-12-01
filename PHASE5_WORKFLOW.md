# Phase 5: Live Chat System - Complete Workflow

## 📋 Overview

Phase 5 implements a **manual assignment** live chat system where customers can chat with agents in real-time. Agents manually accept chats from the pending queue.

---

## 🔄 Complete Workflow

### **1. Customer Starts Chat**

#### Step 1.1: Customer Initiates Chat
- Customer clicks "Start Chat" on website/widget
- Frontend calls: `POST /api/live-chat/start` OR Socket.IO `chat:start` event
- Request includes:
  - `subject`: Chat subject/question
  - `priority`: low, medium, high, urgent (optional)
  - `required_skills`: Array of skills needed (optional)
  - `metadata`: Browser info, page URL, etc. (optional)

#### Step 1.2: Chat Session Created
- Backend creates `LiveChatSession` with:
  - `status: "pending"` (always pending - no auto-assignment)
  - `customer_id`: Customer's user ID
  - `priority`: From request or default "medium"
  - `required_skills`: From request (if provided)
  - `metadata`: Includes customer preload data
- Customer context is automatically loaded:
  - Previous tickets count
  - Previous chats count
  - Account status and age
  - Browser/device info

#### Step 1.3: Notification Sent
- Socket.IO emits `chat:new_session` event to all online agents
- All agents see new pending chat in their dashboard
- Chat appears in pending queue

---

### **2. Agent Views Pending Chats**

#### Step 2.1: Agent Dashboard
- Agent opens dashboard/chat panel
- Frontend calls: `GET /api/live-chat/agent/sessions?status=pending`
- Returns list of all pending chats
- Chats can be filtered/sorted by:
  - Priority (urgent → low)
  - Wait time (oldest first)
  - Required skills

#### Step 2.2: Queue Statistics
- Agent can view queue stats: `GET /api/live-chat/queue/stats`
- Shows:
  - Total pending chats
  - Breakdown by priority
  - Wait times for each chat

---

### **3. Agent Accepts Chat**

#### Step 3.1: Agent Selects Chat
- Agent clicks "Accept" on a pending chat
- Frontend sends Socket.IO event: `chat:accept`
- OR uses REST API (if needed)

#### Step 3.2: Chat Assigned
- Backend updates `LiveChatSession`:
  - `status: "pending"` → `"active"`
  - `agent_id`: Agent's user ID
  - `assigned_at`: Current timestamp
  - `wait_time`: Calculated wait time
- Socket.IO emits `chat:session_assigned` to chat room
- Customer and agent both notified

#### Step 3.3: Chat Room Joined
- Agent joins Socket.IO room: `session_{session_id}`
- Customer already in room
- Both can now send/receive messages

---

### **4. Live Chat Conversation**

#### Step 4.1: Send Messages
- **Text Messages:**
  - Socket.IO: `chat:send_message` event
  - Data: `{ session_id, type: "text", content: "message" }`
  - Message saved to database
  - Broadcasted to chat room via `chat:new_message`

- **File Messages:**
  - Step 1: Upload file via `POST /api/chat-upload/upload`
  - Step 2: Send message with `attachment_url`
  - Socket.IO: `chat:send_message` with `type: "file"`

- **KB Article Share:**
  - Socket.IO: `chat:send_message` with `type: "kb_article"` and `kb_article_id`
  - Article details included in message

- **Canned Response:**
  - Socket.IO: `chat:use_canned_response` event
  - Variables replaced (e.g., `{{customer_name}}`)
  - Sent as regular text message

#### Step 4.2: Real-time Features
- **Typing Indicators:**
  - Socket.IO: `chat:typing` event
  - Shows when user is typing

- **Read Receipts:**
  - Socket.IO: `chat:seen` event
  - Tracks last seen message ID
  - Shows read/unread status

- **Activity Tracking:**
  - Agent activity ping: `agent:activity_ping`
  - Updates `last_activity_at`
  - Auto-away detection (if implemented)

---

### **5. Chat Management**

#### Step 5.1: View Customer Context
- Agent can view customer info: `GET /api/live-chat/:id/customer-context`
- Shows:
  - Customer details
  - Previous tickets
  - Previous chats
  - Active tickets/chats
  - Account information

#### Step 5.2: Transfer Chat
- Agent can transfer to another agent:
  - Socket.IO: `chat:transfer` event
  - OR REST API: `POST /api/live-chat/:id/transfer`
  - Transfer history logged
  - System message created
  - New agent notified

#### Step 5.3: Convert to Ticket
- Agent converts chat to ticket:
  - `POST /api/live-chat/:id/convert-to-ticket`
  - Creates ticket with chat transcript
  - Links chat to ticket
  - System message added

---

### **6. End Chat**

#### Step 6.1: Close Chat
- Customer or Agent ends chat:
  - Socket.IO: `chat:end` event
  - Updates `status: "closed"`
  - Sets `ended_at` timestamp
  - Emits `chat:ended` to room

#### Step 6.2: Chat History
- All messages saved in database
- Can be retrieved: `GET /api/live-chat/:id/messages`
- Chat linked to ticket (if converted)

---

## 🔄 Alternative Flow: Admin Manual Assignment

### **Admin Assigns Chat to Agent**

1. Admin views all pending chats: `GET /api/live-chat/admin/all-sessions`
2. Admin selects chat and agent
3. Admin assigns: `POST /api/live-chat/:id/assign`
   - Body: `{ "agent_id": 2 }`
4. Chat assigned to specified agent
5. Agent and customer notified

---

## 📊 Agent Dashboard Features

### **Pending Queue View**
- List of all pending chats
- Grouped by priority (urgent first)
- Shows wait time
- Shows required skills
- Agent clicks "Accept" to take chat

### **Active Chats View**
- Agent's currently active chats
- Multi-chat management
- Can transfer between chats
- Shows customer context

### **Workload Management**
- View own workload: `GET /api/live-chat/agent/:agent_id/workload`
- Shows:
  - Active chats count
  - Capacity utilization
  - Available slots
  - List of active chats

---

## 🔌 Socket.IO Events Flow

### **Customer Side:**
1. Connect with JWT token
2. `chat:start` → Create session
3. `chat:join` → Join session room
4. `chat:send_message` → Send messages
5. `chat:typing` → Show typing
6. `chat:seen` → Mark as read
7. `chat:end` → End chat

### **Agent Side:**
1. Connect with JWT token
2. Auto-set status to "online"
3. Listen to `chat:new_session` → See new chats
4. `chat:accept` → Accept pending chat
5. `chat:join` → Join session room
6. `chat:send_message` → Send messages
7. `chat:use_canned_response` → Use templates
8. `chat:transfer` → Transfer chat
9. `agent:activity_ping` → Keep status active

---

## 🎯 Key Points

### **Manual Assignment Only:**
- ✅ No automatic assignment
- ✅ All chats start as "pending"
- ✅ Agents manually accept chats
- ✅ Admin can manually assign

### **Real-time Communication:**
- ✅ Socket.IO for instant messaging
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Status updates

### **Agent Features:**
- ✅ View pending queue
- ✅ Accept chats manually
- ✅ Multi-chat management
- ✅ Transfer chats
- ✅ Use canned responses
- ✅ Share KB articles
- ✅ Upload files

### **Customer Features:**
- ✅ Start chat sessions
- ✅ Real-time messaging
- ✅ File sharing
- ✅ View chat history
- ✅ Convert to ticket (via agent)

---

## 📋 Data Flow Summary

```
Customer → Start Chat → Pending Queue → Agent Accepts → Active Chat → Messages → End Chat
                ↓
         Customer Context Loaded
                ↓
         Notify All Agents
                ↓
         Agent Dashboard Shows Pending
                ↓
         Agent Clicks Accept
                ↓
         Chat Becomes Active
                ↓
         Real-time Messaging
```

---

**This is the complete Phase 5 workflow with manual assignment! ✅**

