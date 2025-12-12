// Transfer chat to another agent
function transferChat(sessionId, toAgentId, reason = "Transferred by agent") {
  if (!activeSessions.has(sessionId)) {
    console.log("❌ Session not active.");
    return;
  }
  socket.emit(
    "chat:transfer",
    { session_id: sessionId, to_agent_id: toAgentId, reason },
    (res) => {
      if (res && res.success) {
        console.log(`✅ Chat ${sessionId} transferred to agent ${toAgentId}`);
        // Optionally remove from activeSessions if needed
      } else {
        console.log("❌ Transfer failed:", res && res.message ? res.message : res);
      }
    }
  );
}

const io = require("socket.io-client");

// ⚠️ IMPORTANT: Replace with your actual agent JWT token
const AGENT_TOKEN = "YOUR_AGENT_TOKEN_HERE";

// Auto-accept toggle
const AUTO_ACCEPT = false;

const socket = io("http://localhost:5000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OCwiZW1haWwiOiJBYWthc2hAZ21haWwuY29tIiwicm9sZSI6Miwicm9sZV9uYW1lIjoiYWdlbnQiLCJpYXQiOjE3NjU1NDE1NjQsImV4cCI6MTc2NTYyNzk2NH0.UnCk39L5uDR3HgoGEZ7gt6XqXquUX8g1GTP_rRTQtSI",
  },
});

let activeSessions = new Map();
let currentSessionId = null;

// ============================================
// SOCKET CONNECTION EVENTS
// ============================================

socket.on("connect", () => {
  console.log("✅ Agent connected to Socket.IO!");
  console.log("📊 Agent status: online\n");
  setTimeout(() => rl.prompt(), 400);
});

socket.on("disconnect", () => console.log("❌ Disconnected from server"));

socket.on("connect_error", (err) => {
  console.log("❌ Connection error:", err.message);
});

// ============================================
// CHAT SESSION EVENTS
// ============================================

socket.on("chat:new_session", (session) => {
  console.log("\n📥 New Pending Chat!");
  console.log("Session ID:", session.id);
  console.log("Subject:", session.subject);

  if (AUTO_ACCEPT) acceptChat(session.id);
  else console.log(`Type: accept ${session.id}`);

  rl.prompt();
});

socket.on("chat:session_assigned", (data) => {
  console.log("\n✅ Chat Session Assigned:", data.session_id);
  activeSessions.set(data.session_id, true);
  currentSessionId = data.session_id;

  socket.emit("chat:join", { session_id: data.session_id });

  if (AUTO_ACCEPT) {
    setTimeout(() => {
      sendMessage(data.session_id, "Hello! How can I help you today?");
    }, 800);
  }

  rl.prompt();
});

socket.on("chat:new_message", (msg) => {
  const by = msg.sender_role === "agent" ? "You" : "Customer";
  console.log(`\n📩 ${by}: ${msg.content}`);
  if (!currentSessionId) currentSessionId = msg.session_id;
  rl.prompt();
});

socket.on("chat:ended", (data) => {
  console.log(`\n🔚 Chat ${data.session_id} ended by ${data.ended_by}`);
  activeSessions.delete(data.session_id);
  if (currentSessionId === data.session_id) currentSessionId = null;
  rl.prompt();
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function acceptChat(id) {
  socket.emit("chat:accept", { session_id: id }, (res) => {
    if (res.success) {
      console.log("✅ Chat accepted!");
      activeSessions.set(id, true);
      socket.emit("chat:join", { session_id: id });
    } else {
      console.log("❌ Failed to accept chat:", res.message);
    }
  });
}

function sendMessage(id, content) {
  if (!activeSessions.has(id)) return console.log("❌ Session not active.");

  socket.emit(
    "chat:send_message",
    { session_id: id, type: "text", content },
    (res) => {
      if (res.success) console.log("✅ Message sent");
      else console.log("❌ Failed to send:", res.message);
    }
  );
}

function updateStatus(status) {
  socket.emit(
    "agent:update_status",
    { availability_status: status },
    (res) => {
      if (res.success) console.log("✅ Status updated:", status);
      else console.log("❌ Failed to update:", res.message);
    }
  );
}

function sendActivityPing() {
  socket.emit("agent:activity_ping");
}

function endChat(id) {
  if (!activeSessions.has(id))
    return console.log("❌ Session not active / not found.");

  socket.emit("chat:end", { session_id: id }, (res) => {
    if (!res || res.success === false) {
      console.log("❌ Failed to end chat");
      return;
    }

    console.log(`✅ Chat ${id} ended successfully`);
    activeSessions.delete(id);
    if (currentSessionId === id) currentSessionId = null;
  });
}

// ============================================
// COMMAND-LINE INTERFACE
// ============================================

const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

// ==========================
// FIXED COMMAND PARSER
// ==========================
rl.on("line", (input) => {
  const trimmed = input.trim();
  if (!trimmed) return rl.prompt();

  try {
    // ACCEPT CHAT
    if (trimmed.startsWith("acceptChat(") || trimmed.startsWith("accept ")) {
      let id;
      if (trimmed.startsWith("acceptChat(")) {
        const m = trimmed.match(/acceptChat\((\d+)\)/);
        if (!m) return console.log("❌ Usage: acceptChat(1)");
        id = parseInt(m[1]);
      } else {
        const p = trimmed.split(" ");
        if (p.length !== 2) return console.log("❌ Usage: accept 1");
        id = parseInt(p[1]);
      }
      acceptChat(id);
      currentSessionId = id;
    }

    // SEND MESSAGE
    else if (trimmed.startsWith("sendMessage(")) {
      const m = trimmed.match(/sendMessage\((\d+),\s*["'](.+?)["']\)/);
      if (!m) return console.log('❌ Usage: sendMessage(1, "Hello")');
      sendMessage(parseInt(m[1]), m[2]);
    }

    else if (trimmed.startsWith("msg ")) {
      const parts = trimmed.substring(4).split(" ");
      if (parts.length < 2) return console.log("❌ Usage: msg 1 Hello");
      sendMessage(parseInt(parts[0]), parts.slice(1).join(" "));
    }

    // UPDATE STATUS
    else if (
      trimmed.startsWith("updateStatus(") ||
      trimmed.startsWith("status ")
    ) {
      let status;
      if (trimmed.startsWith("updateStatus(")) {
        const m = trimmed.match(/updateStatus\(["'](.+?)["']\)/);
        if (!m) return console.log('❌ Usage: updateStatus("online")');
        status = m[1];
      } else {
        const p = trimmed.split(" ");
        status = p[1];
      }
      updateStatus(status);
    }

    // ACTIVITY PING
    else if (trimmed === "sendActivityPing()" || trimmed === "ping") {
      sendActivityPing();
      console.log("✅ Ping sent");
    }

    // END CHAT  ← FIXED BLOCK
    else if (trimmed.startsWith("end ") || trimmed.startsWith("endChat(")) {
      let id;
      if (trimmed.startsWith("endChat(")) {
        const m = trimmed.match(/endChat\((\d+)\)/);
        if (!m) return console.log("❌ Usage: endChat(1)");
        id = parseInt(m[1]);
      } else {
        const p = trimmed.split(" ");
        if (p.length !== 2) return console.log("❌ Usage: end 1");
        id = parseInt(p[1]);
      }
      endChat(id);
    }

    // LIST SESSIONS
    else if (trimmed === "sessions") {
      console.log("\n📋 Active Sessions:");
      if (activeSessions.size === 0) console.log("No active sessions");
      activeSessions.forEach((_, id) =>
        console.log(`• ${id} ${id === currentSessionId ? "(current)" : ""}`)
      );
    }

    // SET CURRENT SESSION
    else if (trimmed.startsWith("set ")) {
      const id = parseInt(trimmed.split(" ")[1]);
      if (!activeSessions.has(id))
        return console.log("❌ Session not active");
      currentSessionId = id;
      console.log(`✅ Current session set to ${id}`);
    }

    // TRANSFER CHAT
    else if (trimmed.startsWith("transfer ")) {
      // Usage: transfer <session_id> <to_agent_id> [reason]
      const parts = trimmed.split(" ");
      if (parts.length < 3) {
        return console.log("❌ Usage: transfer <session_id> <to_agent_id> [reason]");
      }
      const sessionId = parseInt(parts[1]);
      const toAgentId = parseInt(parts[2]);
      const reason = parts.slice(3).join(" ") || "Transferred by agent";
      transferChat(sessionId, toAgentId, reason);
    }

    // HELP
    else if (["help", "?", "h"].includes(trimmed)) {
      console.log(`
📋 COMMANDS:
 accept 1                - Accept chat
 msg 1 Hello             - Send message
 end 1                   - End chat
 sessions                - List sessions
 set 1                   - Make session active
 ping                    - Keep agent online
 transfer 10 8 [reason]    - Transfer chat 1 to agent 5 (optional reason)
 help                    - Show menu
 exit                    - Quit
`);
    }

    // EXIT
    else if (["exit", "quit", "q"].includes(trimmed)) {
      console.log("👋 Goodbye!");
      process.exit(0);
    }

    // DEFAULT — SEND MESSAGE
    else if (currentSessionId) {
      sendMessage(currentSessionId, trimmed);
    }

    // UNKNOWN
    else {
      console.log("❌ Unknown command. Type 'help'");
    }
  } catch (err) {
    console.log("❌ Error:", err.message);
  }

  rl.prompt();
});

// CTRL+C
rl.on("SIGINT", () => {
  console.log("\n👋 Goodbye!");
  process.exit(0);
});

console.log("💡 Agent CLI ready! Type 'help' for commands.\n");
