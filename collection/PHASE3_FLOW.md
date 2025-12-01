# Phase 3 - Ticketing System Flow

## 📋 Overview

Phase 3 implements a complete ticketing system with categories, ticket creation, messages, @mentions, internal notes, and file attachments.

---

## 🎯 Objectives

- ✅ Ticket category management
- ✅ Ticket creation and management
- ✅ Ticket messages with @mentions
- ✅ Internal notes (agent-only)
- ✅ File attachments
- ✅ SLA management
- ✅ Priority levels

---

## 🔄 Complete Ticketing Flow

### **1. Ticket Category Management**

#### **Get All Categories (Public)**
```
GET /api/ticket-categories
```
**No authentication required**

**Response:**
```json
[
  {
    "id": 1,
    "name": "Technical Support",
    "description": "Technical issues",
    "created_at": "..."
  }
]
```

#### **Create Category (Admin)**
```
POST /api/ticket-categories
Headers: Authorization: Bearer <admin_token>
Body: {
    "name": "Technical Support",
    "description": "Technical issues and support"
}
```

#### **Update Category (Admin)**
```
PUT /api/ticket-categories/:category_id
Headers: Authorization: Bearer <admin_token>
Body: {
    "name": "Updated Name",
    "description": "Updated description"
}
```

#### **Delete Category (Admin)**
```
DELETE /api/ticket-categories/:category_id
Headers: Authorization: Bearer <admin_token>
```

---

### **2. Ticket Creation Flow**

#### **Step 1: Customer Creates Ticket**
```
POST /api/tickets
Headers: Authorization: Bearer <customer_token>
Body: {
    "subject": "Need help with login",
    "description": "I cannot login to my account",
    "category_id": 1,
    "priority": "high"  // low, medium, high, urgent
}
```

**Response:**
```json
{
  "message": "Ticket created successfully",
  "ticket": {
    "id": 1,
    "subject": "Need help with login",
    "status": "open",
    "priority": "high",
    "sla_due_at": "2025-12-01T10:00:00.000Z",
    ...
  }
}
```

**Save `ticket.id` for subsequent requests!**

---

### **3. View Tickets**

#### **Customer: Get My Tickets**
```
GET /api/tickets/my-tickets
Headers: Authorization: Bearer <customer_token>
```

**Response:** List of customer's tickets

#### **Get Ticket Details**
```
GET /api/tickets/:ticket_id
Headers: Authorization: Bearer <token>
```

**Response:** Ticket with all messages and attachments

#### **Agent: Get Tickets by Category**
```
GET /api/tickets/category/:category_id
Headers: Authorization: Bearer <agent_token>
```

#### **Admin: Get All Tickets**
```
GET /api/tickets
Headers: Authorization: Bearer <admin_token>
```

---

### **4. Ticket Messages Flow**

#### **Customer Adds Message**
```
POST /api/tickets/:ticket_id/message
Headers: Authorization: Bearer <customer_token>
Body: {
    "message": "Thank you for your help! @agent1 can you check this?",
    "internal_note": false
}
```

**Features:**
- Supports @mentions (e.g., `@agent1`)
- Mentions are parsed and stored
- Customer messages are visible to all

---

#### **Agent Adds Message**
```
POST /api/tickets/:ticket_id/message
Headers: Authorization: Bearer <agent_token>
Body: {
    "message": "I'll help you with this issue.",
    "internal_note": false
}
```

**Auto-assignment:** First agent message auto-assigns ticket to that agent

---

#### **Agent Adds Internal Note**
```
POST /api/tickets/:ticket_id/message
Headers: Authorization: Bearer <agent_token>
Body: {
    "message": "Internal note: Customer needs urgent help",
    "internal_note": true
}
```

**Features:**
- Internal notes are NOT visible to customers
- Only agents and admins can see them
- Useful for team communication

---

### **5. File Attachments Flow**

#### **Upload Attachment**
```
POST /api/tickets/:ticket_id/message/:message_id/attachment
Headers: Authorization: Bearer <token>
Body: form-data
  - file: [select file]
```

**Supported Files:**
- All file types
- Max size: 20MB

**Response:**
```json
{
  "message": "Attachment uploaded successfully",
  "attachment": {
    "id": 1,
    "filename": "screenshot.png",
    "file_path": "/uploads/tickets/...",
    ...
  }
}
```

---

## 📝 Step-by-Step Testing Flow

### **Complete Ticket Lifecycle:**

1. **Admin Creates Category:**
   ```bash
   POST /api/ticket-categories
   {
       "name": "Technical Support",
       "description": "Technical issues"
   }
   ```
   - Save `category_id` from response

2. **Customer Creates Ticket:**
   ```bash
   POST /api/tickets
   {
       "subject": "Login issue",
       "description": "Cannot login",
       "category_id": 1,
       "priority": "high"
   }
   ```
   - Save `ticket_id` from response

3. **Customer Adds Message:**
   ```bash
   POST /api/tickets/:ticket_id/message
   {
       "message": "Please help me with this issue",
       "internal_note": false
   }
   ```
   - Save `message_id` from response

4. **Customer Uploads Attachment:**
   ```bash
   POST /api/tickets/:ticket_id/message/:message_id/attachment
   [Upload file]
   ```

5. **Agent Views Ticket:**
   ```bash
   GET /api/tickets/:ticket_id
   ```

6. **Agent Replies:**
   ```bash
   POST /api/tickets/:ticket_id/message
   {
       "message": "I'll help you with this",
       "internal_note": false
   }
   ```
   - Ticket is auto-assigned to agent

7. **Agent Adds Internal Note:**
   ```bash
   POST /api/tickets/:ticket_id/message
   {
       "message": "Need to escalate to technical team",
       "internal_note": true
   }
   ```

8. **Customer Views Updated Ticket:**
   ```bash
   GET /api/tickets/:ticket_id
   ```
   - Sees agent's public message
   - Does NOT see internal note

---

## 🎯 Priority Levels

- `low` - Standard priority
- `medium` - Normal priority (default)
- `high` - High priority
- `urgent` - Urgent priority

**SLA Calculation:**
- Low: 72 hours
- Medium: 48 hours
- High: 24 hours
- Urgent: 12 hours

---

## 📊 Ticket Statuses

- `open` - New ticket
- `in_progress` - Being worked on
- `pending` - Waiting for customer
- `resolved` - Resolved
- `closed` - Closed

---

## ✅ Success Criteria

- [ ] Categories can be created/updated/deleted
- [ ] Customer can create tickets
- [ ] Customer can view own tickets
- [ ] Agent can view tickets by category
- [ ] Messages can be added to tickets
- [ ] @mentions work correctly
- [ ] Internal notes work (agent-only)
- [ ] File attachments can be uploaded
- [ ] Ticket auto-assignment works

---

## 🔧 Environment Variables

**File Upload:**
- Max file size: 20MB
- Storage: `uploads/tickets/`

---

## 🚀 Next Phase

After Phase 3 is complete, proceed to:
- **Phase 4:** Knowledge Base Management

---

## 📋 @Mentions Feature

**Format:** `@username` or `@agent1`

**How it works:**
- Mentions are parsed from message text
- Stored as structured data
- Can be used for notifications
- Example: `"@agent1 can you check this?"`

---

**Phase 3 provides complete ticket management capabilities! ✅**

