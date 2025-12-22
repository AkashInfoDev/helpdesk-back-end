// src/routes/phase5/cannedResponseRoutes.js

const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authMiddleware");
const role = require("../../middleware/roleMiddleware");

const {
    getAllCannedResponses,
    getCannedResponse,
    createCannedResponse,
    updateCannedResponse,
    deleteCannedResponse,
    useCannedResponse,
    getCategories,
    getByShortcut
} = require("../../controllers/phase5/cannedResponseController");

// ----------------------------------------
// AGENT ROUTES
// ----------------------------------------

// Get all canned responses (shared + own)
router.get("/", auth, role("agent", "admin"), getAllCannedResponses);

// Get categories
router.get("/categories", auth, role("agent", "admin"), getCategories);

// Get by shortcut key
router.get("/shortcut/:shortcut", auth, role("agent", "admin"), getByShortcut);

// Get single canned response
router.get("/:id", auth, role("agent", "admin"), getCannedResponse);

// Create canned response
router.post("/", auth, role("agent", "admin"), createCannedResponse);

// Update canned response
router.put("/:id", auth, role("agent", "admin"), updateCannedResponse);

// Delete canned response
router.delete("/:id", auth, role("agent", "admin"), deleteCannedResponse);

// Use canned response (with variable substitution)
router.post("/use/:id", auth, role("agent", "admin"), useCannedResponse);

module.exports = router;

