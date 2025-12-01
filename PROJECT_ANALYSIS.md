# Helpdesk Backend - Project Structure & Phase 5 Analysis

## 📁 Backend Folder Structure

```
helpdesk-backend-main/
├── server.js                    # Main entry point (Express + Socket.IO)
├── package.json                 # Dependencies & scripts
├── src/
│   ├── config/
│   │   └── db.js               # Sequelize database configuration
│   │
│   ├── models/                 # Sequelize ORM Models
│   │   ├── index.js           # Model initialization & associations
│   │   ├── User.js            # User model (customers, agents)
│   │   ├── AdminUser.js       # Admin user model
│   │   ├── Role.js            # Role model (admin, agent, customer)
│   │   ├── Otp.js             # OTP model for email verification
│   │   │
│   │   ├── phase3/            # Phase 3: Ticketing Models
│   │   │   ├── Ticket.js
│   │   │   ├── TicketCategory.js
│   │   │   ├── TicketMessage.js
│   │   │   └── TicketAttachment.js
│   │   │
│   │   ├── phase4/            # Phase 4: Knowledge Base Models
│   │   │   ├── KBCategory.js
│   │   │   ├── KBArticle.js
│   │   │   └── KBArticleHistory.js
│   │   │
│   │   └── phase5/            # Phase 5: Live Chat Models
│   │       ├── LiveChatSession.js
│   │       ├── LiveChatMessage.js
│   │       └── CannedResponse.js
│   │
│   ├── controllers/            # Business Logic Layer
│   │   ├── authController.js  # Authentication (login, OTP, signup)
│   │   │
│   │   ├── phase3/            # Phase 3: Ticket Controllers
│   │   │   ├── ticketController.js
│   │   │   ├── ticketCategoryController.js
│   │   │   ├── ticketMessageController.js
│   │   │   └── ticketAttachmentController.js
│   │   │
│   │   ├── phase4/            # Phase 4: KB Controllers
│   │   │   ├── kbCategoryController.js
│   │   │   ├── kbArticleController.js
│   │   │   └── kbUploadController.js
│   │   │
│   │   └── phase5/            # Phase 5: Live Chat Controllers
│   │       ├── liveChatController.js
│   │       ├── agentAvailabilityController.js
│   │       ├── chatUploadController.js
│   │       └── cannedResponseController.js
│   │
│   ├── routes/                 # API Route Definitions
│   │   ├── authRoutes.js
│   │   ├── phase3/
│   │   │   ├── ticketRoutes.js
│   │   │   └── ticketCategoryRoutes.js
│   │   ├── phase4/
│   │   │   ├── kbCategoryRoutes.js
│   │   │   ├── kbArticleRoutes.js
│   │   │   └── kbUploadRoutes.js
│   │   └── phase5/
│   │       ├── liveChatRoutes.js
│   │       ├── agentAvailabilityRoutes.js
│   │       ├── chatUploadRoutes.js
│   │       └── cannedResponseRoutes.js
│   │
│   ├── middleware/             # Express Middleware
│   │   ├── authMiddleware.js  # JWT token verification
│   │   ├── roleMiddleware.js  # Role-based access control
│   │   ├── ticketUpload.js    # File upload for tickets
│   │   ├── kbUpload.js        # File upload for KB articles
│   │   ├── chatUpload.js      # File upload for chat
│   │   ├── errorHandler.js    # Global error handling
│   │   └── rateLimiter.js     # Rate limiting middleware
│   │
│   ├── socket/                 # Socket.IO Real-time Handlers
│   │   └── chatSocket.js      # Live chat socket events
│   │
│   ├── utils/                  # Utility Functions
│   │   ├── emailService.js    # Nodemailer email service
│   │   ├── tokenGenerator.js  # JWT token generation
│   │   ├── chatRouter.js      # Chat routing logic
│   │   ├── logger.js          # Winston structured logging
│   │   └── envValidator.js    # Environment variable validation
│   │
│   └── seeders/                # Database Seeders
│       └── roleSeeder.js      # Initial role data
│
└── uploads/                    # File Upload Storage
    ├── kb/                     # Knowledge base uploads
    ├── tickets/                # Ticket attachments
    └── chat/                   # Chat file uploads
```

---

## 🔄 Project Flow & Architecture

### **1. Request Flow (REST API)**

```
Client Request
    ↓
Express Server (server.js)
    ↓
Route Handler (routes/*)
    ↓
Middleware Chain:
    - authMiddleware (JWT verification)
    - roleMiddleware (RBAC check)
    ↓
Controller (controllers/*)
    ↓
Model Layer (models/* via Sequelize)
    ↓
MySQL Database
    ↓
Response to Client
```

### **2. Real-time Flow (Socket.IO)**

```
Client Socket Connection
    ↓
Socket.IO Server (server.js)
    ↓
JWT Authentication Middleware (socket/chatSocket.js)
    ↓
Socket Event Handlers:
    - chat:start (start new chat)
    - chat:join (join session room)
    - chat:accept (agent accept chat)
    - chat:send_message (send message)
    - chat:typing (typing indicator)
    - chat:seen (read receipt)
    - chat:end (end chat session)
    - chat:use_canned_response (use canned response)
    - chat:transfer (transfer chat)
    - agent:update_status (update agent status)
    - agent:activity_ping (keep status active)
    - agent:get_all_status (get all agents status)
    ↓
Database Operations (via Models)
    ↓
Emit Events to Room/All Clients
```

### **3. Database Architecture**

- **Sequelize ORM** with MySQL
- **No Foreign Key Constraints** (constraints: false) - flexible for development
- **Relationships defined** in `models/index.js`:
  - User ↔ Role (Many-to-One)
  - User ↔ Tickets (One-to-Many)
  - Ticket ↔ TicketMessage (One-to-Many)
  - TicketMessage ↔ TicketAttachment (One-to-Many)
  - KBCategory ↔ KBArticle (One-to-Many)
  - KBArticle ↔ KBArticleHistory (One-to-Many)
  - User ↔ LiveChatSession (One-to-Many)
  - LiveChatSession ↔ LiveChatMessage (One-to-Many)
  - KBArticle ↔ LiveChatMessage (One-to-Many)
  - User ↔ CannedResponse (One-to-Many, created_by)

---

## ✅ Completed Features (Phases 1-5)

### **Phase 1: Foundation & Setup** ✅
- ✅ Express.js server setup
- ✅ MySQL database with Sequelize ORM
- ✅ Environment configuration
- ✅ CORS & middleware setup
- ✅ File upload handling

### **Phase 2: Authentication & Role Management** ✅
- ✅ JWT-based authentication
- ✅ OTP email verification for registration
- ✅ Login for Admin, Agent, Customer
- ✅ Role-based access control (RBAC) middleware
- ✅ User profile management
- ✅ Password hashing with bcryptjs

### **Phase 3: Ticketing Core** ✅
- ✅ Ticket CRUD operations
- ✅ Ticket categories management
- ✅ Ticket messages with @mentions
- ✅ Ticket attachments
- ✅ Ticket status workflow (open, pending, in_progress, resolved, closed, reopened)
- ✅ Priority levels (low, medium, high, urgent)
- ✅ SLA tracking fields (sla_due_at, is_overdue)
- ✅ Internal notes support

### **Phase 4: Knowledge Base** ✅
- ✅ KB category CRUD
- ✅ KB article CRUD
- ✅ Article versioning/history
- ✅ Article approval workflow
- ✅ File upload for KB articles
- ✅ Public/Private article visibility
- ✅ Article helpfulness rating (model ready)

### **Phase 5: Live Chat System** ✅ **COMPLETE**

#### ✅ **All Features Implemented:**

1. **Socket.io Server Setup** ✅
   - ✅ HTTP server with Socket.IO integration
   - ✅ JWT authentication for socket connections
   - ✅ Room-based messaging (session-based rooms)
   - ✅ Real-time event handling

2. **Basic Chat Functionality** ✅
   - ✅ Start chat session (customer)
   - ✅ Join session room
   - ✅ Agent accept session (manual assignment)
   - ✅ Send/receive messages (real-time)
   - ✅ Typing indicators
   - ✅ Read receipts (seen status)
   - ✅ End chat session

3. **Chat-to-Ticket Conversion** ✅
   - ✅ Convert chat session to ticket
   - ✅ Link chat history to ticket
   - ✅ Preserve conversation transcript

4. **KB Article Sharing** ✅
   - ✅ Share KB articles in chat (kb_article_id in messages)
   - ✅ Message type: "kb_article"

5. **Agent Availability Management** ✅
   - ✅ Status tracking (online, offline, busy, away)
   - ✅ Status updates via REST API and Socket.IO
   - ✅ Auto-status on connect/disconnect
   - ✅ Activity tracking (last_activity_at)
   - ✅ Status persistence in database (User model)
   - ✅ Agent skills management
   - ✅ Max concurrent chats configuration

6. **Chat Routing & Queue System** ✅
   - ✅ Queue management (pending chats)
   - ✅ Queue statistics endpoint
   - ✅ Manual chat assignment (Admin)
   - ✅ Skills-based routing support (required_skills field)
   - ✅ Workload balancing (getAgentWorkload, getAllAgentsWorkload)
   - ✅ Chat priority levels (low, medium, high, urgent)
   - ✅ Wait time tracking
   - ✅ Chat transfer between agents
   - ✅ Transfer history tracking

7. **Canned Responses System** ✅
   - ✅ Canned response CRUD operations
   - ✅ Category organization
   - ✅ Shortcut keys support
   - ✅ Variable substitution ({{variable_name}})
   - ✅ Personal and shared responses (is_shared flag)
   - ✅ Usage tracking
   - ✅ Socket.IO integration (chat:use_canned_response)

8. **File Sharing in Chat** ✅
   - ✅ File upload handler (chatUploadController)
   - ✅ File validation (size, type)
   - ✅ File storage (uploads/chat/ directory)
   - ✅ Support for images, PDFs, documents
   - ✅ Max file size: 10MB
   - ✅ File message type in Socket.IO

9. **Multi-Chat Management** ✅
   - ✅ Concurrent chat limit enforcement (max_concurrent_chats)
   - ✅ Chat prioritization (priority field)
   - ✅ Chat transfer functionality
   - ✅ Agent workload tracking
   - ✅ Multiple session support

10. **Customer Context/Preload** ✅
    - ✅ Structured customer preload data
    - ✅ Customer name, email, account status
    - ✅ Previous tickets count and history
    - ✅ Previous chats count and history
    - ✅ Account age calculation
    - ✅ Metadata support (browser, page_url, etc.)
    - ✅ REST API endpoint (GET /api/live-chat/:id/customer-context)

11. **REST API Endpoints** ✅
    - ✅ `POST /api/live-chat/start` - Start session
    - ✅ `GET /api/live-chat/my-sessions` - Customer sessions
    - ✅ `GET /api/live-chat/agent/sessions` - Agent sessions
    - ✅ `GET /api/live-chat/admin/all-sessions` - All sessions
    - ✅ `GET /api/live-chat/:id/messages` - Get messages
    - ✅ `GET /api/live-chat/:id/customer-context` - Get customer context
    - ✅ `POST /api/live-chat/:id/convert-to-ticket` - Convert to ticket
    - ✅ `POST /api/live-chat/:id/assign` - Manual assign (Admin)
    - ✅ `POST /api/live-chat/:id/transfer` - Transfer chat
    - ✅ `GET /api/live-chat/queue/stats` - Queue statistics
    - ✅ `GET /api/live-chat/agent/:agent_id/workload` - Agent workload
    - ✅ `GET /api/live-chat/admin/agents-workload` - All agents workload
    - ✅ `PUT /api/agent-availability/my-status` - Update status
    - ✅ `GET /api/agent-availability/my-status` - Get status
    - ✅ `PUT /api/agent-availability/my-max-chats` - Update max chats
    - ✅ `PUT /api/agent-availability/my-skills` - Update skills
    - ✅ `GET /api/agent-availability/all-agents` - All agents status
    - ✅ `POST /api/chat-upload/upload` - Upload file
    - ✅ `GET /api/chat-upload/file/:filename` - Get file info
    - ✅ `GET /api/canned-responses` - Get all responses
    - ✅ `POST /api/canned-responses` - Create response
    - ✅ `PUT /api/canned-responses/:id` - Update response
    - ✅ `DELETE /api/canned-responses/:id` - Delete response
    - ✅ `POST /api/canned-responses/:id/use` - Use response
    - ✅ `GET /api/canned-responses/categories` - Get categories
    - ✅ `GET /api/canned-responses/shortcut/:shortcut` - Get by shortcut

12. **Socket.IO Events** ✅
    - ✅ `chat:start` - Start new chat
    - ✅ `chat:accept` - Agent accept chat
    - ✅ `chat:join` - Join session room
    - ✅ `chat:send_message` - Send message
    - ✅ `chat:typing` - Typing indicator
    - ✅ `chat:seen` - Read receipt
    - ✅ `chat:end` - End chat session
    - ✅ `chat:new_session` - New pending chat notification
    - ✅ `chat:session_assigned` - Chat assigned notification
    - ✅ `chat:new_message` - New message broadcast
    - ✅ `chat:ended` - Chat ended notification
    - ✅ `chat:use_canned_response` - Use canned response
    - ✅ `chat:transfer` - Transfer chat
    - ✅ `agent:update_status` - Update agent status
    - ✅ `agent:activity_ping` - Keep status active
    - ✅ `agent:get_all_status` - Get all agents status
    - ✅ `agent:status_changed` - Status changed broadcast

---

## 📊 Phase 5 Completion Summary

| Feature | Status | Completion % |
|---------|--------|--------------|
| Socket.io Server | ✅ Complete | 100% |
| Basic Messaging | ✅ Complete | 100% |
| Chat-to-Ticket | ✅ Complete | 100% |
| KB Article Share | ✅ Complete | 100% |
| Typing Indicators | ✅ Complete | 100% |
| Read Receipts | ✅ Complete | 100% |
| Chat Routing/Queue | ✅ Complete | 100% |
| Canned Responses | ✅ Complete | 100% |
| File Sharing | ✅ Complete | 100% |
| Agent Availability | ✅ Complete | 100% |
| Multi-Chat Management | ✅ Complete | 100% |
| Customer Preload | ✅ Complete | 100% |
| Chat Transfer | ✅ Complete | 100% |
| **Chatbot Handoff** | ❌ Not Included | N/A |

**Overall Phase 5 Completion: 100%** ✅

**Note:** Chatbot handoff functionality is intentionally not included as per project requirements. Phase 5 focuses on direct agent-to-customer live chat conversations.

---

## 🎯 Project Status Summary

### **All Phases Complete** ✅

**Phase 1:** Foundation & Setup - ✅ 100% Complete  
**Phase 2:** Authentication & Role Management - ✅ 100% Complete  
**Phase 3:** Ticketing System - ✅ 100% Complete  
**Phase 4:** Knowledge Base Management - ✅ 100% Complete  
**Phase 5:** Live Chat System - ✅ 100% Complete  

### **Production Ready Features:**
- ✅ Complete REST API (57+ endpoints)
- ✅ Real-time Socket.IO communication
- ✅ JWT authentication & RBAC
- ✅ File uploads (tickets, KB, chat)
- ✅ Database models & relationships
- ✅ Error handling & logging
- ✅ Rate limiting & CORS
- ✅ Health checks & graceful shutdown
- ✅ Environment validation
- ✅ Cross-platform compatibility

### **Documentation Available:**
- ✅ Postman collections for all phases
- ✅ Flow documentation for all phases
- ✅ Testing guides
- ✅ Socket.IO test clients
- ✅ Deployment guides

---

## 🔧 Technical Stack Summary

- **Runtime:** Node.js
- **Framework:** Express.js 5.1.0
- **Database:** MySQL (via Sequelize ORM 6.37.7)
- **Real-time:** Socket.IO 4.8.1
- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **File Upload:** Multer (via custom middleware)
- **Email:** Nodemailer 7.0.11
- **Password Hashing:** bcryptjs 3.0.3
- **Logging:** Winston (structured logging)
- **Rate Limiting:** express-rate-limit
- **Validation:** express-validator

---

## 📝 Notes

- All models use `constraints: false` for flexible development
- Socket.IO uses JWT authentication via handshake.auth.token
- File uploads stored in `uploads/` directory
- Environment variables required: `DB_*`, `JWT_SECRET`, `EMAIL_*`
- Server runs on port 5000 (configurable via PORT env var)

