// src/routes/phase5/chatUploadRoutes.js

const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authMiddleware");
const chatUpload = require("../../middleware/chatUpload");
const {
    uploadChatFile,
    getFileInfo
} = require("../../controllers/phase5/chatUploadController");

// ----------------------------------------
// FILE UPLOAD ROUTES (AGENT + CUSTOMER + ADMIN)
// ----------------------------------------

// Upload file for chat (single file)
router.post(
    "/upload",
    auth,
    chatUpload.single("file"),
    uploadChatFile
);

// Get file info
router.get("/file/:filename", auth, getFileInfo);

module.exports = router;

