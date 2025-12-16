const io = require("socket.io-client");

// ⚠️ IMPORTANT: Replace with your actual customer JWT token
// Get token by logging in as customer via: POST /api/auth/login
const CUSTOMER_TOKEN = "YOUR_CUSTOMER_TOKEN_HERE";

const socket = io("http://localhost:5000", {
    auth: {
        token:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImVtYWlsIjoib21AZ21haWwuY29tIiwicm9sZSI6Mywicm9sZV9uYW1lIjoiY3VzdG9tZXIiLCJpYXQiOjE3NjU3NzU5MzYsImV4cCI6MTc2NTg2MjMzNn0.gvdYF-C9WIzsBhXo8tVFtABigo30JNixl_RiLTwkcik",
    },
});

let currentSessionId = null;

// ============================================
// CONNECTION EVENTS
// ============================================

socket.on("connect", () => {
    console.log("✅ Customer connected to Socket.IO!");
    console.log("📋 Ready to start chat session...\n");
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected from server");
});

socket.on("connect_error", (error) => {
    console.error("❌ Connection error:", error.message);
    console.log("💡 Make sure:");
    console.log("   1. Server is running on http://localhost:5000");
    console.log("   2. Token is valid (login first)");
    console.log("   3. Token is not expired\n");
});

// ============================================
// CHAT SESSION EVENTS
// ============================================

// Listen for when agent accepts the chat
socket.on("chat:session_assigned", (data) => {
    console.log("\n👨‍💼 Agent Assigned to Chat!");
    console.log("   Session ID:", data.session_id);
    console.log("   Agent ID:", data.agent_id);
    console.log("   ✅ You can now send messages!\n");

    // Join the session room
    socket.emit("chat:join", { session_id: data.session_id });

    // Auto-send a greeting message
    setTimeout(() => {
        sendMessage("Hello Agent! I need help with my account.");
        rl.prompt();
    }, 1000);
});

// ============================================
// MESSAGE EVENTS
// ============================================

// Listen for new messages
socket.on("chat:new_message", (message) => {
    const sender = message.sender_role === "customer" ? "You" : "Agent";
    console.log(`\n📩 ${sender}: ${message.content || "[File/Attachment]"}`, {
        type: message.type,
        timestamp: message.created_at,
    });

    // Show prompt if interactive mode is active
    if (currentSessionId) {
        rl.prompt();
    }
});

// Listen for typing indicators
socket.on("chat:typing", (data) => {
    if (data.role === "agent" && data.isTyping) {
        console.log("⌨️  Agent is typing...");
    }
});

// Listen for chat ended
socket.on("chat:ended", (data) => {
    console.log(`\n🔚 Chat session has been ended by ${data.ended_by}`);
    currentSessionId = null;
    rl.prompt();
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function sendMessage(content) {
    if (!currentSessionId) {
        console.log("❌ No active session. Start a chat first!");
        return;
    }

    socket.emit(
        "chat:send_message",
        {
            session_id: currentSessionId,
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

// End chat session
function endChat() {
    if (!currentSessionId) {
        console.log("❌ No active session to end.");
        return;
    }

    socket.emit("chat:end", { session_id: currentSessionId }, (response) => {
        if (response && response.success !== false) {
            console.log("✅ Chat session ended successfully");
            currentSessionId = null;
        } else {
            console.log("❌ Failed to end chat");
        }
        rl.prompt();
    });
}

// ============================================
// START CHAT SESSION
// ============================================

console.log("🚀 Starting chat session...\n");

socket.emit(
    "chat:start",
    {
        subject: "Need help with my account",
        priority: "medium",
        required_skills: ["technical"],
        metadata: {
            browser: "Chrome",
            page_url: "https://example.com/help",
        },
    },
    (response) => {
        if (response.success) {
            console.log("✅ Chat session created!");
            console.log("   Session ID:", response.session.id);
            console.log("   Status:", response.session.status);
            console.log("   Message:", response.message);
            console.log("\n⏳ Waiting for agent to accept...\n");

            currentSessionId = response.session.id;

            // Join the session room
            socket.emit("chat:join", { session_id: response.session.id });
        } else {
            console.log("❌ Failed to start chat:", response.message);
            rl.close();
            process.exit(1);
        }
    }
);

// ============================================
// EXAMPLE: Send messages after agent accepts
// ============================================

// Uncomment to send test messages
// setTimeout(() => {
//   sendMessage("This is my first message");
// }, 5000);

// setTimeout(() => {
//   sendMessage("Can you help me with billing?");
// }, 8000);

// ============================================
// INTERACTIVE MODE - Enable typing messages
// ============================================

const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "You> ",
});

// Show prompt after session is assigned
socket.on("chat:session_assigned", () => {
    setTimeout(() => {
        console.log("\n💡 You can now type messages! (Press Enter to send)");
        console.log("   Type 'exit' to quit\n");
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

    // Handle exit
    if (trimmed === "exit" || trimmed === "quit" || trimmed === "q") {
        console.log("\n👋 Goodbye!");
        rl.close();
        process.exit(0);
        return;
    }

    // Handle end chat
    if (trimmed === "end" || trimmed === "endchat") {
        if (currentSessionId) {
            endChat();
        } else {
            console.log("❌ No active session to end.");
            rl.prompt();
        }
        return;
    }

    // Handle help
    if (trimmed === "help" || trimmed === "?" || trimmed === "h") {
        console.log("\n📋 Available Commands:");
        console.log("   <message>     - Send a message");
        console.log("   end or endchat - End current chat");
        console.log("   exit or quit  - Exit chat");
        console.log("   help          - Show this help\n");
        rl.prompt();
        return;
    }

    // Send message if session is active
    if (currentSessionId) {
        sendMessage(trimmed);
    } else {
        console.log("❌ No active session. Wait for agent to accept chat first.");
        rl.prompt();
    }
});

// Handle Ctrl+C
rl.on("SIGINT", () => {
    console.log("\n👋 Goodbye!");
    rl.close();
    process.exit(0);
});
