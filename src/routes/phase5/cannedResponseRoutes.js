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
router.get("/", auth, role("agent"), getAllCannedResponses);

// Get categories
router.get("/categories", auth, role("agent"), getCategories);

// Get by shortcut key
router.get("/shortcut/:shortcut", auth, role("agent"), getByShortcut);

// Get single canned response
router.get("/:id", auth, role("agent"), getCannedResponse);

// Create canned response
router.post("/", auth, role("agent"), createCannedResponse);

// Update canned response
router.put("/:id", auth, role("agent"), updateCannedResponse);

// Delete canned response
router.delete("/:id", auth, role("agent"), deleteCannedResponse);

// Use canned response (with variable substitution)
router.post("/:id/use", auth, role("agent"), useCannedResponse);

module.exports = router;

