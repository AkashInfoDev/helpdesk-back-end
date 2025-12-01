# How to Test Socket.IO Live Chat in Terminal

## 🚀 Quick Start Guide

### **Step 1: Make Sure Server is Running**

First, start your backend server:

```bash
# In project root
npm start
# or
npm run dev
```

You should see:

```
✅ Database connected
🚀 Server running on port 5000
⚡ Socket.IO active and running
```

---

### **Step 2: Open Two Terminal Windows**

You need **TWO separate terminals** - one for customer, one for agent.

#### **Terminal 1 - Customer:**

```bash
cd socket-test
node customer.js
```

#### **Terminal 2 - Agent:**

```bash
cd socket-test
node agent.js
```

---

## 📋 Complete Testing Flow

### **1. Start Agent First (Recommended)**

**Terminal 2 (Agent):**

```bash
cd socket-test
node agent.js
```

**Expected Output:**

```
✅ Agent connected to Socket.IO!
👂 Listening for pending chats...

📊 Agent status: online

📋 Available functions:
   acceptChat(sessionId) - Accept a pending chat
   sendMessage(sessionId, content) - Send a message
   updateStatus('online'|'offline'|'busy'|'away') - Update status
   sendActivityPing() - Keep status active
```

**Agent is now online and waiting for chats!**

---

### **2. Start Customer**

**Terminal 1 (Customer):**

```bash
cd socket-test
node customer.js
```

**Expected Output:**

```
🚀 Starting chat session...

✅ Customer connected to Socket.IO!
📋 Ready to start chat session...

✅ Chat session created!
   Session ID: 1
   Status: pending
   Message: Chat session created. Waiting for agent to accept.

⏳ Waiting for agent to accept...
```

**Customer has started a chat and is waiting!**

---

### **3. Agent Sees Pending Chat**

**In Terminal 2 (Agent), you should see:**

```
📥 New Pending Chat Session!
   Session ID: 1
   Subject: Need help with my account
   Priority: medium
   Customer ID: 1
   Required Skills: None
   Status: pending

💡 To accept this chat, call: acceptChat(1)
   Or set AUTO_ACCEPT = true to auto-accept
```

---

### **4. Agent Accepts Chat**

**Option A: Manual Acceptance (Current Setup)**

In **Terminal 2 (Agent)**, you'll see a `>` prompt. Type:

```
accept 1
```

or

```
acceptChat(1)
```

**Expected Output:**

```
✅ Chat accepted successfully!
✅ Chat Session Assigned!
   Session ID: 1
   Agent ID: 3
   ✅ You can now chat with customer!
```

**Option B: Auto-Accept (Change in agent.js)**

Edit `agent.js` and change:

```javascript
const AUTO_ACCEPT = true; // Change from false to true
```

Then restart agent:

```bash
node agent.js
```

---

### **5. Customer Gets Notification**

**In Terminal 1 (Customer), you should see:**

```
👨‍💼 Agent Assigned to Chat!
   Session ID: 1
   Agent ID: 3
   ✅ You can now send messages!

📩 You: Hello Agent! I need help with my account.
✅ Message sent successfully
```

**Customer automatically sends a greeting message!**

---

### **6. Agent Receives Message**

**In Terminal 2 (Agent), you should see:**

```
📩 Customer: Hello Agent! I need help with my account.
   { session_id: 1, type: 'text', timestamp: ... }
```

---

### **7. Agent Replies**

**In Terminal 2 (Agent)**, you'll see a `>` prompt. Type:

```
msg 1 Hello! How can I help you today?
```

or simply type your message (if session 1 is the current session):

```
Hello! How can I help you today?
```

**Expected Output:**

```
✅ Message sent successfully
```

**In Terminal 1 (Customer), you should see:**

```
📩 Agent: Hello! How can I help you today?
```

---

### **8. Continue Chatting**

**Customer sends message:**
In **Terminal 1 (Customer)**, just type your message and press Enter.

**Agent sends message:**
In **Terminal 2 (Agent)**, type:

```
Hello! How can I help you?
```

### **9. End Chat**

**To end the chat:**

**Agent:**

```
> end 1
✅ Chat session 1 ended successfully
```

**Customer:**

```
You> end
✅ Chat session ended successfully
```

Both parties will be notified when the chat ends:

```
🔚 Chat session has been ended by agent
```

---

## 💬 Interactive Chat Mode

### **Enable Interactive Mode for Customer**

Edit `customer.js` and uncomment the interactive section at the bottom:

```javascript
// Uncomment this section:
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("line", (input) => {
  if (input.trim()) {
    sendMessage(input.trim());
  }
});
```

Now you can type messages directly in the customer terminal!

---

## 🎯 Complete Example Session

### **Terminal 1 (Customer):**

```bash
$ node customer.js
✅ Customer connected to Socket.IO!
🚀 Starting chat session...
✅ Chat session created!
   Session ID: 1
   Status: pending
⏳ Waiting for agent to accept...

👨‍💼 Agent Assigned to Chat!
   Session ID: 1
   Agent ID: 3
   ✅ You can now send messages!

📩 You: Hello Agent! I need help with my account.
✅ Message sent successfully

📩 Agent: Hello! How can I help you today?
```

### **Terminal 2 (Agent):**

```bash
$ node agent.js
✅ Agent connected to Socket.IO!
👂 Listening for pending chats...

💡 Interactive mode enabled! Type commands below:
   Example: accept 1
   Example: msg 1 Hello customer!
   Type 'help' for all commands

>
📥 New Pending Chat Session!
   Session ID: 1
   Subject: Need help with my account
   Status: pending

💡 To accept this chat, type: accept 1

> accept 1
✅ Chat accepted successfully!
✅ Chat Session Assigned!
   Session ID: 1
   Agent ID: 3
   ✅ You can now chat with customer!

>
📩 Customer: Hello Agent! I need help with my account.

> Hello! How can I help you today?
✅ Message sent successfully
```

---

## 🔧 Common Commands

### **Agent Commands:**

```
# Accept a chat
accept 1
# or
acceptChat(1)

# Send a message
msg 1 Your message here
# or (if session 1 is current)
Your message here

# Update status
status online
status busy
status away
# or
updateStatus("online")

# Send activity ping
ping
# or
sendActivityPing()

# Show active sessions
sessions

# Set current session
set 1

# End a chat
end 1
# or
endChat(1)

# Show help
help
```

### **Customer Commands:**

```
# Send a message
Just type your message and press Enter

# End current chat
end
# or
endchat

# Show help
help

# Exit
exit
```

---

## 🐛 Troubleshooting

### **Problem: "Connection refused"**

**Solution:**

- Make sure server is running: `npm start`
- Check server is on port 5000
- Check firewall settings

### **Problem: "Unauthorized: Invalid token"**

**Solution:**

- Token might be expired
- Get new token by logging in again
- Update token in `customer.js` or `agent.js`

### **Problem: Agent doesn't see pending chat**

**Solution:**

- Make sure agent is connected BEFORE customer starts chat
- Check agent token is valid
- Check server logs for errors

### **Problem: Messages not received**

**Solution:**

- Make sure both users joined the session room
- Check session ID is correct
- Verify chat status is "active" (not "pending")

### **Problem: "Session not found"**

**Solution:**

- Use correct session ID
- Make sure session exists in database
- Check session status

---

## 📊 Testing Checklist

- [ ] Server is running
- [ ] Agent connects successfully
- [ ] Customer connects successfully
- [ ] Customer can start chat
- [ ] Agent sees pending chat
- [ ] Agent can accept chat
- [ ] Customer receives assignment notification
- [ ] Customer can send messages
- [ ] Agent can receive messages
- [ ] Agent can send messages
- [ ] Customer can receive messages
- [ ] Multiple messages work
- [ ] Typing indicators work (if implemented)

---

## 🎬 Video Walkthrough Steps

1. **Terminal 1:** Start server → `npm start`
2. **Terminal 2:** Start agent → `node agent.js`
3. **Terminal 3:** Start customer → `node customer.js`
4. **Terminal 2:** Accept chat → `acceptChat(1)`
5. **Terminal 2:** Send message → `sendMessage(1, "Hello!")`
6. **Terminal 3:** See message received
7. **Continue chatting!**

---

## 💡 Tips

1. **Keep server terminal visible** - See logs and errors
2. **Use separate terminals** - Easier to see both sides
3. **Check session IDs** - Make sure you use correct ID
4. **Test step by step** - Don't rush, verify each step
5. **Check server logs** - See what events are emitted

---

## 🚀 Quick Test Script

Want to test quickly? Here's a simple flow:

```bash
# Terminal 1: Server
npm start

# Terminal 2: Agent (wait for "Listening for pending chats...")
node agent.js

# Terminal 3: Customer
node customer.js

# Back to Terminal 2: Accept chat
acceptChat(1)

# Terminal 2: Send message
sendMessage(1, "Hello customer!")

# Terminal 3: Should see the message!
```

---

**That's it! You're now testing live chat in terminal! 🎉**
