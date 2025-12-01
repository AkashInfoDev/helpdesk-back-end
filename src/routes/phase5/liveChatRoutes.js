// src/routes/phase5/liveChatRoutes.js

const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authMiddleware");
const role = require("../../middleware/roleMiddleware");

const {
    startSession,
    getMySessions,
    getAgentSessions,
    getAllSessions,
    getSessionMessages,
    convertToTicket,
    getQueueStats,
    // autoAssignChats, // DISABLED - Manual assignment only
    manualAssignChat,
    transferChat,
    getAgentWorkload,
    getAllAgentsWorkload,
    getCustomerContext
} = require("../../controllers/phase5/liveChatController");


// ----------------------------------------
// CUSTOMER ROUTES
// ----------------------------------------

// Start chat session
router.post("/start", auth, role("customer"), startSession);

// My chat sessions
router.get("/my-sessions", auth, role("customer"), getMySessions);


// ----------------------------------------
// AGENT ROUTES
// ----------------------------------------

// Get pending/active/closed sessions
router.get("/agent/sessions", auth, role("agent"), getAgentSessions);


// ----------------------------------------
// ADMIN ROUTES
// ----------------------------------------

// Admin can see all sessions
router.get("/admin/all-sessions", auth, role("admin"), getAllSessions);


// ----------------------------------------
// SHARED ROUTES (AGENT + ADMIN + CUSTOMER)
// ----------------------------------------

// Load session messages
router.get("/:id/messages", auth, getSessionMessages);

// Get customer context for session
router.get("/:id/customer-context", auth, getCustomerContext);


// ----------------------------------------
// CONVERT CHAT → TICKET (AGENT + ADMIN)
// ----------------------------------------
router.post("/:id/convert-to-ticket", auth, role("agent", "admin"), convertToTicket);


// ----------------------------------------
// QUEUE MANAGEMENT ROUTES
// ----------------------------------------

// Get queue statistics
router.get("/queue/stats", auth, role("agent", "admin"), getQueueStats);

// Auto-assign pending chats (DISABLED - Manual assignment only)
// router.post("/queue/auto-assign", auth, role("admin"), autoAssignChats);

// Manually assign chat to agent (Admin)
router.post("/:id/assign", auth, role("admin"), manualAssignChat);

// Transfer chat to another agent (Agent + Admin)
router.post("/:id/transfer", auth, role("agent", "admin"), transferChat);

// Get agent workload
router.get("/agent/:agent_id/workload", auth, getAgentWorkload);

// Get all agents workload (Admin)
router.get("/admin/agents-workload", auth, role("admin"), getAllAgentsWorkload);


module.exports = router;
