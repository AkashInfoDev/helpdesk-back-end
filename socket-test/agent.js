const io = require("socket.io-client");

// ⚠️ IMPORTANT: Replace with your actual agent JWT token
// Get token by logging in as agent via: POST /api/auth/login
const AGENT_TOKEN = "YOUR_AGENT_TOKEN_HERE";

// Set to true to auto-accept pending chats, false to manually accept
const AUTO_ACCEPT = false;

const socket = io("http://localhost:5000", {
  auth: {
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiZW1haWwiOiJhYXNoaXNoQGdtYWlsLmNvbSIsInJvbGUiOjIsInJvbGVfbmFtZSI6ImFnZW50IiwiaWF0IjoxNzY0NTg5MzY2LCJleHAiOjE3NjQ2NzU3NjZ9.mtYwN8TuhlcuwkWqs_FjBZQbr5vLfn-BxaCwNvE5_0A",
  },
});

let activeSessions = new Map(); // Track active sessions

// ============================================
// CONNECTION EVENTS
// ============================================

socket.on("connect", () => {
  console.log("✅ Agent connected to Socket.IO!");
  console.log("👂 Listening for pending chats...\n");

  // Agent status is automatically set to "online" on connect
  console.log("📊 Agent status: online");
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
  // Agent status is automatically set to "offline" on disconnect
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error.message);
  console.log("💡 Make sure:");
  console.log("   1. Server is running on http://localhost:5000");
  console.log("   2. Token is valid (login first)");
  console.log("   3. Token is not expired\n");
});

// ============================================
// AGENT STATUS EVENTS
// ============================================

// Listen for agent status changes
socket.on("agent:status_changed", (data) => {
  console.log(`\n📊 Agent Status Changed:`, {
    agent_id: data.agent_id,
    status: data.status,
  });
});

// ============================================
// CHAT SESSION EVENTS
// ============================================

// Listen for new pending chat sessions
socket.on("chat:new_session", (session) => {
  console.log("\n📥 New Pending Chat Session!");
  console.log("   Session ID:", session.id);
  console.log("   Subject:", session.subject);
  console.log("   Priority:", session.priority);
  console.log("   Customer ID:", session.customer_id);
  console.log("   Required Skills:", session.required_skills || "None");
  console.log("   Status:", session.status);

  if (AUTO_ACCEPT) {
    console.log("\n🤖 Auto-accepting chat...");
    acceptChat(session.id);
  } else {
    console.log(`\n💡 To accept this chat, type: accept ${session.id}`);
    console.log("   Or set AUTO_ACCEPT = true to auto-accept\n");
  }

  // Show prompt
  rl.prompt();
});

// Listen for session assignment confirmation
socket.on("chat:session_assigned", (data) => {
  console.log("\n✅ Chat Session Assigned!");
  console.log("   Session ID:", data.session_id);
  console.log("   Agent ID:", data.agent_id);
  console.log("   ✅ You can now chat with customer!\n");

  activeSessions.set(data.session_id, true);
  currentSessionId = data.session_id; // Set as current session

  // Join the session room
  socket.emit("chat:join", { session_id: data.session_id });

  // Auto-send greeting if enabled
  if (AUTO_ACCEPT) {
    setTimeout(() => {
      sendMessage(
        data.session_id,
        "Hello! Thank you for contacting us. How can I help you today?"
      );
    }, 1000);
  }

  // Show prompt
  rl.prompt();
});

// ============================================
// MESSAGE EVENTS
// ============================================

// Listen for new messages from customers
socket.on("chat:new_message", (message) => {
  const sender = message.sender_role === "agent" ? "You" : "Customer";
  console.log(`\n📩 ${sender}: ${message.content || "[File/Attachment]"}`, {
    session_id: message.session_id,
    type: message.type,
    timestamp: message.created_at,
  });

  // Set as current session if not set
  if (!currentSessionId && message.session_id) {
    currentSessionId = message.session_id;
  }

  // Auto-reply if enabled (optional)
  if (AUTO_ACCEPT && message.sender_role === "customer") {
    setTimeout(() => {
      sendMessage(
        message.session_id,
        "I'm here to help! Let me check that for you."
      );
    }, 2000);
  }

  // Show prompt
  rl.prompt();
});

// Listen for typing indicators
socket.on("chat:typing", (data) => {
  if (data.role === "customer" && data.isTyping) {
    console.log("⌨️  Customer is typing...");
  }
});

// Listen for chat ended
socket.on("chat:ended", (data) => {
  console.log(
    `\n🔚 Chat session ${data.session_id} has been ended by ${data.ended_by}`
  );
  activeSessions.delete(data.session_id);
  if (currentSessionId === data.session_id) {
    currentSessionId = null;
  }
  rl.prompt();
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Accept a pending chat session
function acceptChat(sessionId) {
  socket.emit("chat:accept", { session_id: sessionId }, (response) => {
    if (response.success) {
      console.log("✅ Chat accepted successfully!");
      activeSessions.set(sessionId, true);
      socket.emit("chat:join", { session_id: sessionId });
    } else {
      console.log("❌ Failed to accept chat:", response.message);
    }
  });
}

// Send a message to a session
function sendMessage(sessionId, content) {
  if (!activeSessions.has(sessionId)) {
    console.log("❌ Session not active. Accept the chat first!");
    return;
  }

  socket.emit(
    "chat:send_message",
    {
      session_id: sessionId,
      type: "text",
      content: content,
    },
    (response) => {
      if (response.success) {
        console.log("✅ Message sent successfully");
      } else {
        console.log("❌ Failed to send message:", response.message);
      }
    }
  );
}

// Update agent status
function updateStatus(status) {
  socket.emit(
    "agent:update_status",
    { availability_status: status },
    (response) => {
      if (response.success) {
        console.log(`✅ Status updated to: ${status}`);
      } else {
        console.log("❌ Failed to update status:", response.message);
      }
    }
  );
}

// Send activity ping (keeps agent status as "online")
function sendActivityPing() {
  socket.emit("agent:activity_ping");
}

// End a chat session
function endChat(sessionId) {
  if (!activeSessions.has(sessionId)) {
    console.log("❌ Session not active or not found.");
    rl.prompt();
    return;
  }

  socket.emit("chat:end", { session_id: sessionId }, (response) => {
    if (response && response.success !== false) {
      console.log(`✅ Chat session ${sessionId} ended successfully`);
      activeSessions.delete(sessionId);
      if (currentSessionId === sessionId) {
        currentSessionId = null;
      }
    } else {
      console.log("❌ Failed to end chat");
    }
    rl.prompt();
  });
}

// ============================================
// INTERACTIVE MODE - Enable typing commands
// ============================================

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

// Track current active session for quick messaging
let currentSessionId = null;

// Show prompt after connection
socket.on("connect", () => {
  setTimeout(() => {
    rl.prompt();
  }, 500);
});

// Handle user input
rl.on("line", (input) => {
  const trimmed = input.trim();

  if (!trimmed) {
    rl.prompt();
    return;
  }

  // Parse commands
  try {
    // Handle acceptChat(sessionId) or accept <id>
    if (trimmed.startsWith("acceptChat(") || trimmed.startsWith("accept ")) {
      let sessionId;
      if (trimmed.startsWith("acceptChat(")) {
        const match = trimmed.match(/acceptChat\((\d+)\)/);
        if (match) {
          sessionId = parseInt(match[1]);
        } else {
          console.log("❌ Usage: acceptChat(1) or accept 1");
          rl.prompt();
          return;
        }
      } else {
        const parts = trimmed.split(" ");
        if (parts.length === 2) {
          sessionId = parseInt(parts[1]);
        } else {
          console.log("❌ Usage: accept 1");
          rl.prompt();
          return;
        }
      }
      acceptChat(sessionId);
      currentSessionId = sessionId;
    }
    // Handle sendMessage(sessionId, "message") or msg <id> <message> or just type message if session is active
    else if (trimmed.startsWith("sendMessage(")) {
      const match = trimmed.match(/sendMessage\((\d+),\s*["'](.+?)["']\)/);
      if (match) {
        const sessionId = parseInt(match[1]);
        const message = match[2];
        sendMessage(sessionId, message);
      } else {
        console.log('❌ Usage: sendMessage(1, "Your message here")');
      }
    }
    // Handle msg <id> <message> or just message if session active
    else if (trimmed.startsWith("msg ")) {
      const parts = trimmed.substring(4).split(" ");
      if (parts.length >= 2) {
        const sessionId = parseInt(parts[0]);
        const message = parts.slice(1).join(" ");
        sendMessage(sessionId, message);
      } else {
        console.log("❌ Usage: msg 1 Your message here");
      }
    }
    // If currentSessionId is set and input doesn't start with a command, treat as message
    else if (currentSessionId && !trimmed.startsWith("/")) {
      sendMessage(currentSessionId, trimmed);
    }
    // Handle updateStatus("status") or status <status>
    else if (
      trimmed.startsWith("updateStatus(") ||
      trimmed.startsWith("status ")
    ) {
      let status;
      if (trimmed.startsWith("updateStatus(")) {
        const match = trimmed.match(/updateStatus\(["'](.+?)["']\)/);
        if (match) {
          status = match[1];
        } else {
          console.log('❌ Usage: updateStatus("online")');
          rl.prompt();
          return;
        }
      } else {
        const parts = trimmed.split(" ");
        if (parts.length === 2) {
          status = parts[1];
        } else {
          console.log("❌ Usage: status online");
          rl.prompt();
          return;
        }
      }
      updateStatus(status);
    }
    // Handle sendActivityPing() or ping
    else if (trimmed === "sendActivityPing()" || trimmed === "ping") {
      sendActivityPing();
      console.log("✅ Activity ping sent");
    }
    // Handle end chat
    else if (trimmed.startsWith("end ") || trimmed.startsWith("endChat(")) {
      let sessionId;
      if (trimmed.startsWith("endChat(")) {
        const match = trimmed.match(/endChat\((\d+)\)/);
        if (match) {
          sessionId = parseInt(match[1]);
        } else {
          console.log("❌ Usage: endChat(1) or end 1");
          rl.prompt();
          return;
        }
      } else {
        const parts = trimmed.split(" ");
        if (parts.length === 2) {
          sessionId = parseInt(parts[1]);
        } else {
          console.log("❌ Usage: end 1");
          rl.prompt();
          return;
        }
      }
      endChat(sessionId);
    }
    // Handle help
    else if (trimmed === "help" || trimmed === "?" || trimmed === "h") {
      console.log("\n📋 Available Commands:");
      console.log(
        "   acceptChat(1) or accept 1          - Accept chat with ID 1"
      );
      console.log(
        '   sendMessage(1, "Hello!")           - Send message to session 1'
      );
      console.log(
        "   msg 1 Hello!                       - Quick send message to session 1"
      );
      console.log(
        "   <message>                          - Send message to current session (if active)"
      );
      console.log(
        '   updateStatus("online") or status   - Update agent status'
      );
      console.log("   sendActivityPing() or ping         - Send activity ping");
      console.log(
        "   sessions                           - Show active sessions"
      );
      console.log(
        "   set <id>                           - Set current session ID"
      );
      console.log("   end 1 or endChat(1)              - End chat session 1");
      console.log("   help or ?                          - Show this help");
      console.log("   exit or quit                       - Exit\n");
    }
    // Handle sessions - show active sessions
    else if (trimmed === "sessions" || trimmed === "list") {
      if (activeSessions.size === 0) {
        console.log("📋 No active sessions");
      } else {
        console.log("\n📋 Active Sessions:");
        activeSessions.forEach((value, sessionId) => {
          console.log(
            `   Session ID: ${sessionId} ${sessionId === currentSessionId ? "(current)" : ""
            }`
          );
        });
        console.log();
      }
    }
    // Handle set current session
    else if (trimmed.startsWith("set ")) {
      const parts = trimmed.split(" ");
      if (parts.length === 2) {
        const sessionId = parseInt(parts[1]);
        if (activeSessions.has(sessionId)) {
          currentSessionId = sessionId;
          console.log(`✅ Current session set to: ${sessionId}`);
        } else {
          console.log(
            `❌ Session ${sessionId} is not active. Accept it first.`
          );
        }
      } else {
        console.log("❌ Usage: set 1");
      }
    }
    // Handle exit
    else if (trimmed === "exit" || trimmed === "quit" || trimmed === "q") {
      console.log("\n👋 Goodbye!");
      rl.close();
      process.exit(0);
    }
    // Unknown command
    else {
      console.log("❌ Unknown command. Type 'help' for available commands.");
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  // Show prompt again
  rl.prompt();
});

// Handle Ctrl+C
rl.on("SIGINT", () => {
  console.log("\n👋 Goodbye!");
  rl.close();
  process.exit(0);
});

console.log("\n💡 Interactive mode enabled! Type commands below:");
console.log("   Example: accept 1");
console.log("   Example: msg 1 Hello customer!");
console.log("   Type 'help' for all commands\n");
