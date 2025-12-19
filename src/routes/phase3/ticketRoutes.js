// // src/routes/phase3/ticketRoutes.js

// const express = require("express");
// const router = express.Router();

// const ticketController = require("../../controllers/phase3/ticketController");
// const messageController = require("../../controllers/phase3/ticketMessageController");
// const attachmentController = require("../../controllers/phase3/ticketAttachmentController");

// const authMiddleware = require("../../middleware/authMiddleware");
// const roleMiddleware = require("../../middleware/roleMiddleware");

// const upload = require("../../middleware/ticketUpload");
// // handles file uploads for attachments

// // ------------------------------------------------------
// // TICKET CREATION (Customer Only)
// // ------------------------------------------------------
// router.post(
//     "/",
//     authMiddleware,
//     roleMiddleware(["customer"]),
//     ticketController.createTicket
// );

// // ------------------------------------------------------
// // GET CUSTOMER TICKETS
// // ------------------------------------------------------
// router.get(
//     "/my-tickets",
//     authMiddleware,
//     roleMiddleware(["customer"]),
//     ticketController.getMyTickets
// );

// // ------------------------------------------------------
// // GET TICKET DETAILS (Customer / Agent)
// // ------------------------------------------------------
// router.get(
//     "/:ticket_id/messages",
//     authMiddleware,
//     roleMiddleware(["customer", "agent", "admin"]),
//     messageController.getTicketMessages
// );

// // ------------------------------------------------------
// // AGENT: GET TICKETS BY CATEGORY
// // ------------------------------------------------------
// router.get(
//     "/category/:category_id",
//     authMiddleware,
//     roleMiddleware(["agent", "admin"]),
//     ticketController.getTicketsByCategory
// );

// router.get(
//     "/category/:category_id",
//     authMiddleware,
//     roleMiddleware(["agent", "admin"]),
//     ticketController.getTicketsByCategory
// );


// // ------------------------------------------------------
// // ADMIN: GET ALL TICKETS
// // ------------------------------------------------------
// router.get(
//     "/",
//     authMiddleware,
//     roleMiddleware(["admin"]),
//     // roleMiddleware(["customer", "agent"]),
//     ticketController.getAllTickets
// );

// // ------------------------------------------------------
// // ADD MESSAGE TO TICKET (Customer & Agent)
// // Auto-assigns agent when agent replies
// // ------------------------------------------------------
// router.post(
//     "/:ticket_id/message",
//     authMiddleware,
//     roleMiddleware(["customer", "agent"]),
//     messageController.addMessage
// );

// router.get(
//     "/:ticket_id/messages",
//     authMiddleware,
//     roleMiddleware(["customer", "agent", "admin"]),
//     messageController.getTicketMessages
// );


// // ------------------------------------------------------
// // ADD ATTACHMENT TO MESSAGE
// // ------------------------------------------------------
// router.post(
//     "/:ticket_id/message/:message_id/attachment",
//     authMiddleware,
//     upload.single("file"),
//     attachmentController.uploadAttachment
// );

// router.get(
//     "/agent/my-active",
//     authMiddleware,
//     roleMiddleware(["agent"]),
//     ticketController.getMyActiveTickets
// );

// router.get(
//     "/queue",
//     authMiddleware,
//     roleMiddleware(["agent", "admin"]),
//     ticketController.getUnassignedTickets
// );

// router.patch(
//     "/:ticket_id/assign",
//     authMiddleware,
//     roleMiddleware(["agent"]),
//     ticketController.assignTicketToSelf
// );

// router.patch(
//     "/:ticket_id/resolve",
//     authMiddleware,
//     roleMiddleware(["agent"]),
//     ticketController.resolveTicket
// );

// router.get(
//     "/agent/resolved",
//     authMiddleware,
//     roleMiddleware(["agent"]),
//     ticketController.getMyResolvedTickets
// );



// module.exports = router;

const express = require("express");
const router = express.Router();

const ticketController = require("../../controllers/phase3/ticketController");
const messageController = require("../../controllers/phase3/ticketMessageController");
const attachmentController = require("../../controllers/phase3/ticketAttachmentController");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");
const upload = require("../../middleware/ticketUpload");

// ------------------------------------------------------
// STATIC / SYSTEM ROUTES (KEEP FIRST)
// ------------------------------------------------------
router.get(
    "/queue",
    authMiddleware,
    roleMiddleware(["agent", "admin"]),
    ticketController.getUnassignedTickets
);

router.get(
    "/agent/my-active",
    authMiddleware,
    roleMiddleware(["agent"]),
    ticketController.getMyActiveTickets
);

router.get(
    "/agent/resolved",
    authMiddleware,
    roleMiddleware(["agent"]),
    ticketController.getMyResolvedTickets
);

// ------------------------------------------------------
// CATEGORY
// ------------------------------------------------------
router.get(
    "/category/:category_id",
    authMiddleware,
    roleMiddleware(["agent", "admin"]),
    ticketController.getTicketsByCategory
);

// ------------------------------------------------------
// CUSTOMER
// ------------------------------------------------------
router.get(
    "/my-tickets",
    authMiddleware,
    roleMiddleware(["customer"]),
    ticketController.getMyTickets
);

// ------------------------------------------------------
// MESSAGES
// ------------------------------------------------------
router.post(
    "/:ticket_id/message",
    authMiddleware,
    roleMiddleware(["customer", "agent"]),
    messageController.addMessage
);

router.get(
    "/:ticket_id/messages",
    authMiddleware,
    roleMiddleware(["customer", "agent", "admin"]),
    messageController.getTicketMessages
);

// ------------------------------------------------------
// ATTACHMENTS
// ------------------------------------------------------
router.post(
    "/:ticket_id/message/:message_id/attachment",
    authMiddleware,
    upload.single("file"),
    attachmentController.uploadAttachment
);

// ------------------------------------------------------
// SINGLE TICKET (IMPORTANT: KEEP LAST)
// ------------------------------------------------------
router.get(
    "/:ticket_id",
    authMiddleware,
    roleMiddleware(["customer", "agent", "admin"]),
    ticketController.getTicketDetails
);

// ------------------------------------------------------
// CREATE / ADMIN
// ------------------------------------------------------
router.post(
    "/",
    authMiddleware,
    roleMiddleware(["customer"]),
    ticketController.createTicket
);

router.get(
    "/",
    authMiddleware,
    roleMiddleware(["admin"]),
    ticketController.getAllTickets
);

module.exports = router;
