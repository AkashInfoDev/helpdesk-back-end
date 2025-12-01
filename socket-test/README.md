# Socket.IO Test Clients - Live Chat Testing

## 📋 Overview

These test clients allow you to test the live chat functionality between customers and agents using Socket.IO.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd socket-test
npm install
```

### 2. Get JWT Tokens

You need JWT tokens for both customer and agent:

#### Get Customer Token:
```bash
POST http://localhost:5000/api/auth/login
Body: {
  "email": "customer@example.com",
  "password": "password",
  "role": "customer"
}
```
Copy the `token` from response.

#### Get Agent Token:
```bash
POST http://localhost:5000/api/auth/login
Body: {
  "email": "agent@example.com",
  "password": "password",
  "role": "agent"
}
```
Copy the `token` from response.

### 3. Update Tokens

#### In `customer.js`:
```javascript
const CUSTOMER_TOKEN = "YOUR_CUSTOMER_TOKEN_HERE";
```

#### In `agent.js`:
```javascript
const AGENT_TOKEN = "YOUR_AGENT_TOKEN_HERE";
```

### 4. Run Test Clients

#### Terminal 1 - Customer:
```bash
node customer.js
```

#### Terminal 2 - Agent:
```bash
node agent.js
```

---

## 📝 How It Works

### **Customer Flow:**
1. Customer connects to Socket.IO
2. Customer starts chat session → `chat:start` event
3. Chat created with `status: "pending"`
4. Customer waits for agent to accept
5. When agent accepts → `chat:session_assigned` event
6. Customer can now send messages

### **Agent Flow:**
1. Agent connects to Socket.IO
2. Agent status automatically set to "online"
3. Agent listens for `chat:new_session` events (pending chats)
4. Agent accepts chat → `chat:accept` event
5. Chat status changes to "active"
6. Agent can now send/receive messages

---

## 🎯 Testing Scenarios

### **Scenario 1: Basic Chat Flow**

1. **Start Customer:**
   ```bash
   node customer.js
   ```
   - Customer starts chat session
   - Chat is created as "pending"

2. **Start Agent:**
   ```bash
   node agent.js
   ```
   - Agent sees new pending chat
   - Agent accepts chat (or auto-accepts if `AUTO_ACCEPT = true`)

3. **Chat:**
   - Customer sends message
   - Agent receives and replies
   - Real-time messaging works!

### **Scenario 2: Manual Acceptance**

1. Set `AUTO_ACCEPT = false` in `agent.js`
2. Start both clients
3. Customer starts chat
4. Agent sees pending chat notification
5. In agent terminal, manually accept:
   ```javascript
   acceptChat(1) // Replace 1 with actual session ID
   ```

### **Scenario 3: Multiple Chats**

1. Start multiple customer clients (different terminals)
2. Each customer starts a chat
3. Agent sees all pending chats
4. Agent accepts chats one by one
5. Agent manages multiple active chats

---

## 🔧 Configuration

### **Customer Options:**

```javascript
// Auto-send messages after agent accepts
setTimeout(() => {
  sendMessage("Hello Agent!");
}, 1000);
```

### **Agent Options:**

```javascript
// Auto-accept pending chats
const AUTO_ACCEPT = true; // or false

// Auto-reply to customer messages
// (enabled when AUTO_ACCEPT = true)
```

---

## 📡 Socket.IO Events

### **Events Emitted (Client → Server):**

| Event | Description | Used By |
|-------|-------------|---------|
| `chat:start` | Start new chat session | Customer |
| `chat:accept` | Accept pending chat | Agent |
| `chat:join` | Join session room | Both |
| `chat:send_message` | Send message | Both |
| `chat:typing` | Typing indicator | Both |
| `agent:update_status` | Update agent status | Agent |
| `agent:activity_ping` | Keep status active | Agent |

### **Events Received (Server → Client):**

| Event | Description | Received By |
|-------|-------------|-------------|
| `chat:new_session` | New pending chat | Agent |
| `chat:session_assigned` | Chat assigned to agent | Both |
| `chat:new_message` | New message received | Both |
| `chat:typing` | User typing | Both |
| `agent:status_changed` | Agent status updated | Agent |

---

## 🧪 Testing Checklist

- [ ] Customer can connect to Socket.IO
- [ ] Agent can connect to Socket.IO
- [ ] Customer can start chat session
- [ ] Agent receives `chat:new_session` event
- [ ] Agent can accept pending chat
- [ ] Customer receives `chat:session_assigned` event
- [ ] Customer can send messages
- [ ] Agent can receive messages
- [ ] Agent can send messages
- [ ] Customer can receive messages
- [ ] Typing indicators work
- [ ] Multiple chats work
- [ ] Agent status updates work

---

## 🐛 Troubleshooting

### **Error: "Unauthorized: No token"**
- **Solution:** Make sure token is set in the file
- **Solution:** Token might be expired, get a new one

### **Error: "Connection refused"**
- **Solution:** Make sure server is running on `http://localhost:5000`
- **Solution:** Check server logs for errors

### **Agent doesn't see pending chats**
- **Solution:** Make sure agent is connected before customer starts chat
- **Solution:** Check agent token is valid
- **Solution:** Check server logs for `chat:new_session` emission

### **Messages not received**
- **Solution:** Make sure both users joined the session room
- **Solution:** Check session ID is correct
- **Solution:** Verify chat status is "active"

---

## 💡 Tips

1. **Use multiple terminals** - One for customer, one for agent
2. **Check server logs** - See what events are being emitted
3. **Use browser console** - Test Socket.IO from browser too
4. **Test edge cases** - Multiple chats, disconnections, etc.

---

## 📚 Additional Resources

- Socket.IO Documentation: https://socket.io/docs/
- Phase 5 Workflow: See `PHASE5_WORKFLOW.md`
- API Documentation: See `PHASE5_TESTING_GUIDE.md`

---

**Happy Testing! 🚀**

