// src/routes/phase3/ticketRoutes.js

const express = require("express");
const router = express.Router();

const ticketController = require("../../controllers/phase3/ticketController");
const messageController = require("../../controllers/phase3/ticketMessageController");
const attachmentController = require("../../controllers/phase3/ticketAttachmentController");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

const upload = require("../../middleware/ticketUpload");
// handles file uploads for attachments

// ------------------------------------------------------
// TICKET CREATION (Customer Only)
// ------------------------------------------------------
router.post(
    "/",
    authMiddleware,
    roleMiddleware(["customer"]),
    ticketController.createTicket
);

// ------------------------------------------------------
// GET CUSTOMER TICKETS
// ------------------------------------------------------
router.get(
    "/my-tickets",
    authMiddleware,
    roleMiddleware(["customer"]),
    ticketController.getMyTickets
);

// ------------------------------------------------------
// GET TICKET DETAILS (Customer / Agent)
// ------------------------------------------------------
router.get(
    "/:ticket_id",
    authMiddleware,
    roleMiddleware(["customer", "agent", "admin"]),
    ticketController.getTicketDetails
);

// ------------------------------------------------------
// AGENT: GET TICKETS BY CATEGORY
// ------------------------------------------------------
router.get(
    "/category/:category_id",
    authMiddleware,
    roleMiddleware(["agent", "admin"]),
    ticketController.getTicketsByCategory
);

// ------------------------------------------------------
// ADMIN: GET ALL TICKETS
// ------------------------------------------------------
router.get(
    "/",
    authMiddleware,
    roleMiddleware(["admin"]),
    ticketController.getAllTickets
);

// ------------------------------------------------------
// ADD MESSAGE TO TICKET (Customer & Agent)
// Auto-assigns agent when agent replies
// ------------------------------------------------------
router.post(
    "/:ticket_id/message",
    authMiddleware,
    roleMiddleware(["customer", "agent"]),
    messageController.addMessage
);

// ------------------------------------------------------
// ADD ATTACHMENT TO MESSAGE
// ------------------------------------------------------
router.post(
    "/:ticket_id/message/:message_id/attachment",
    authMiddleware,
    upload.single("file"),
    attachmentController.uploadAttachment
);

module.exports = router;
