// src/controllers/phase5/chatUploadController.js

const path = require("path");
const { LiveChatSession, LiveChatMessage } = require("../../models");

// ----------------------------------------
// Upload File for Chat Message
// ----------------------------------------
exports.uploadChatFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const { session_id } = req.body;

        // Validate session exists and user has access
        if (session_id) {
            const session = await LiveChatSession.findByPk(session_id);
            
            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: "Chat session not found"
                });
            }

            // Check if user is part of this session
            const isCustomer = session.customer_id === req.user.id;
            const isAgent = session.agent_id === req.user.id;
            const isAdmin = req.user.role_name === "admin";

            if (!isCustomer && !isAgent && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized to upload files to this session"
                });
            }
        }

        // Generate file URL
        const fileUrl = `/uploads/chat/${req.file.filename}`;

        res.json({
            success: true,
            message: "File uploaded successfully",
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: fileUrl,
                path: req.file.path
            }
        });

    } catch (err) {
        console.error("Chat File Upload Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to upload file",
            error: err.message
        });
    }
};

// ----------------------------------------
// Get File Info (for download/access)
// ----------------------------------------
exports.getFileInfo = async (req, res) => {
    try {
        const { filename } = req.params;

        // In a production system, you might want to:
        // 1. Verify user has access to this file
        // 2. Check if file exists in database
        // 3. Log file access

        const filePath = path.join(__dirname, "../../uploads/chat", filename);

        res.json({
            success: true,
            file: {
                filename,
                url: `/uploads/chat/${filename}`
            }
        });

    } catch (err) {
        console.error("Get File Info Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to get file info"
        });
    }
};

