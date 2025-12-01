// src/controllers/phase4/kbUploadController.js

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Construct URL dynamically so it works on localhost + production
        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/kb/${req.file.filename}`;

        return res.status(200).json({
            message: "Image uploaded successfully",
            url: fileUrl,
        });
    } catch (err) {
        console.error("KB Image Upload Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
