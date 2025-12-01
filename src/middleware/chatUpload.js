// src/middleware/chatUpload.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------
// Ensure uploads directory exists
// ---------------------------------------------------------
const uploadPath = path.join(__dirname, "../../uploads/chat");

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// ---------------------------------------------------------
// Multer Storage Configuration
// ---------------------------------------------------------
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const base = file.originalname
            .replace(ext, "")
            .toLowerCase()
            .replace(/\s+/g, "_");

        const unique = Date.now() + "-" + Math.round(Math.random() * 1E9);

        cb(null, `${base}-${unique}${ext}`);
    },
});

// ---------------------------------------------------------
// File Filter – Allow images, PDFs, and common documents
// ---------------------------------------------------------
function fileFilter(req, file, cb) {
    const allowedMimeTypes = [
        // Images
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "image/gif",
        // PDFs
        "application/pdf",
        // Documents
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.ms-excel", // .xls
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "text/plain", // .txt
        "text/csv", // .csv
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
            new Error(
                "File type not allowed. Allowed types: Images (JPEG, PNG, GIF, WebP), PDF, Documents (DOC, DOCX, XLS, XLSX, TXT, CSV)"
            ),
            false
        );
    }

    cb(null, true);
}

// ---------------------------------------------------------
// Multer Upload Instance
// ---------------------------------------------------------
const chatUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB max
    },
});

module.exports = chatUpload;

