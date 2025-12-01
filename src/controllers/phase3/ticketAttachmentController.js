// src/controllers/phase3/ticketAttachmentController.js

const { Ticket, TicketMessage, TicketAttachment } = require("../../models");
const path = require("path");

// ------------------------------------------------------
// UPLOAD ATTACHMENT FOR A MESSAGE
// ------------------------------------------------------
exports.uploadAttachment = async (req, res) => {
    try {
        const { ticket_id, message_id } = req.params;

        // Validate ticket & message
        const ticket = await Ticket.findByPk(ticket_id);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        const message = await TicketMessage.findByPk(message_id);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // File info
        const fileUrl = `/uploads/tickets/${req.file.filename}`;
        const fileName = req.file.originalname;
        const fileType = req.file.mimetype;
        const fileSize = req.file.size;

        const attachment = await TicketAttachment.create({
            message_id,
            file_url: fileUrl,
            file_name: fileName,
            file_type: fileType,
            file_size: fileSize,
            storage_type: "local",
        });

        return res.status(201).json({
            message: "Attachment uploaded successfully",
            attachment,
        });
    } catch (error) {
        console.error("Attachment Upload Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};
