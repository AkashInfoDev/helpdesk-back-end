// src/routes/phase5/agentAvailabilityRoutes.js

const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authMiddleware");
const role = require("../../middleware/roleMiddleware");

const {
  updateMyStatus,
  updateMaxConcurrentChats,
  getMyStatus,
  getAllAgentsStatus,
  updateAgentStatus,
  updateMySkills,
  updateAgentSkills,
} = require("../../controllers/phase5/agentAvailabilityController");

// ----------------------------------------
// AGENT ROUTES
// ----------------------------------------

// Update my availability status
router.put("/my-status", auth, role("agent"), updateMyStatus);

// Update my max concurrent chats
router.put("/my-max-chats", auth, role("agent"), updateMaxConcurrentChats);

// Get my current status and workload
router.get("/my-status", auth, role("agent"), getMyStatus);

// ----------------------------------------
// ADMIN/SUPERVISOR ROUTES
// ----------------------------------------

// Get all agents status (for dashboard)
router.get(
  "/all-agents",
  auth,
  role("admin", "supervisor"),
  getAllAgentsStatus
);

// Update specific agent status (admin override)
router.put("/agent/:agent_id/status", auth, role("admin"), updateAgentStatus);

// Update my skills
router.put("/my-skills", auth, role("agent"), updateMySkills);

// Update agent skills (admin)
router.put("/agent/:agent_id/skills", auth, role("admin"), updateAgentSkills);

module.exports = router;
