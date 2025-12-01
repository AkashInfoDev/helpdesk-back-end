// src/middleware/ticketUpload.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Storage path: /uploads/tickets
const uploadPath = path.join(__dirname, "../../uploads/tickets");

// Create folder if not exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },

    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
        cb(null, uniqueName);
    },
});

// File filter (optional)
function fileFilter(req, file, cb) {
    // Accept all types for ticketing system
    cb(null, true);
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB max
    },
});

module.exports = upload;
