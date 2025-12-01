// src/routes/phase4/kbUploadRoutes.js

const express = require("express");
const router = express.Router();

const kbUpload = require("../../middleware/kbUpload");
const kbUploadController = require("../../controllers/phase4/kbUploadController");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

// -------------------------------------------------------------
// ADMIN ONLY: Upload KB Images for Quill Editor
// -------------------------------------------------------------
router.post(
    "/image",
    authMiddleware,
    roleMiddleware("admin"),
    kbUpload.single("image"),
    kbUploadController.uploadImage
);

module.exports = router;
