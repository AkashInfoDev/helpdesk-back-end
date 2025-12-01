// src/middleware/kbUpload.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------
// Ensure uploads directory exists
// ---------------------------------------------------------
const uploadPath = path.join(__dirname, "../../uploads/kb");

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
            .replace(/\s+/g, "-");

        const unique = Date.now();

        cb(null, `${base}-${unique}${ext}`);
    },
});

// ---------------------------------------------------------
// File Filter – Only allow image uploads
// ---------------------------------------------------------
function fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];

    if (!allowed.includes(file.mimetype)) {
        return cb(new Error("Only image files are allowed"), false);
    }

    cb(null, true);
}

// ---------------------------------------------------------
// Multer Upload Instance
// ---------------------------------------------------------
const kbUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max
    },
});

module.exports = kbUpload;
