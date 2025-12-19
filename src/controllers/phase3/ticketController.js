// src/controllers/phase3/ticketController.js
const { Op } = require("sequelize");
const {
    Ticket,
    TicketCategory,
    TicketMessage,
    User,
} = require("../../models");

// ------------------------------------------------------
// SLA CALCULATOR (simple logic)
// ------------------------------------------------------
function calculateSLA(priority) {
    const now = new Date();

    switch (priority) {
        case "urgent":
            return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
        case "high":
            return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hrs
        case "medium":
            return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hrs
        default:
            return new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hrs
    }
}

// ------------------------------------------------------
// CUSTOMER: CREATE TICKET
// ------------------------------------------------------
exports.createTicket = async (req, res) => {
    try {
        const { subject, description, category_id, priority } = req.body;
        const customer_id = req.user.id;

        if (!subject || !description || !category_id) {
            return res.status(400).json({
                message: "Subject, description and category are required",
            });
        }

        const category = await TicketCategory.findByPk(category_id);
        if (!category) {
            return res.status(404).json({ message: "Invalid category" });
        }

        // Verify customer exists (prevent FK/constraint DB errors)
        const customer = await User.findByPk(customer_id);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const slaDue = calculateSLA(priority);

        const ticket = await Ticket.create({
            customer_id,
            category_id,
            priority,
            subject,
            description,
            sla_due_at: slaDue,
        });

        return res.status(201).json({
            message: "Ticket created successfully",
            ticket,
        });
    } catch (error) {
        console.error("Create Ticket Error:", error);
        // In development expose error message to help debugging
        if (process.env.NODE_ENV !== "production") {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
        return res.status(500).json({ message: "Server Error" });
    }
};

// ------------------------------------------------------
// CUSTOMER: GET MY TICKETS
// ------------------------------------------------------
exports.getMyTickets = async (req, res) => {
    try {
        const customer_id = req.user.id;

        const tickets = await Ticket.findAll({
            where: { customer_id },
            include: [
                { model: TicketCategory, as: "category" },
                { model: User, as: "agent", attributes: ["id", "name"] },
            ],
            order: [["createdAt", "DESC"]],
        });

        return res.json(tickets);
    } catch (error) {
        console.error("Get My Tickets Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// ------------------------------------------------------
// TICKET DETAILS (Customer / Agent / Admin)
// ------------------------------------------------------
exports.getTicketDetails = async (req, res) => {
    try {
        const { ticket_id } = req.params;

        const ticket = await Ticket.findByPk(ticket_id, {
            include: [
                { model: TicketCategory, as: "category" },
                { model: User, as: "customer", attributes: ["id", "name", "email"] },
                { model: User, as: "agent", attributes: ["id", "name"] },
                {
                    model: TicketMessage,
                    as: "messages",
                    include: ["attachments"],
                    order: [["createdAt", "ASC"]],
                },
            ],
        });

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        return res.json(ticket);
    } catch (error) {
        console.error("Get Ticket Details Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// ------------------------------------------------------
// AGENT: GET TICKETS BY CATEGORY
// ------------------------------------------------------
exports.getTicketsByCategory = async (req, res) => {
    try {
        const { category_id } = req.params;

        const tickets = await Ticket.findAll({
            where: { category_id },
            include: [
                { model: TicketCategory, as: "category" },
                { model: User, as: "customer", attributes: ["id", "name"] },
                { model: User, as: "agent", attributes: ["id", "name"] },
            ],
            order: [["createdAt", "DESC"]],
        });

        return res.json(tickets);
    } catch (error) {
        console.error("Get Tickets By Category Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// ------------------------------------------------------
// ADMIN: GET ALL TICKETS
// ------------------------------------------------------
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.findAll({
            include: [
                { model: TicketCategory, as: "category" },
                { model: User, as: "customer", attributes: ["id", "name"] },
                { model: User, as: "agent", attributes: ["id", "name"] },
            ],
            order: [["createdAt", "DESC"]],
        });

        return res.json(tickets);
    } catch (error) {
        console.error("Get All Tickets Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};



exports.getMyActiveTickets = async (req, res) => {
    try {
        const agent_id = req.user.id;

        const tickets = await Ticket.findAll({
            where: {
                agent_id,
                status: {
                    [Op.notIn]: ["resolved", "closed"],
                },
            },
            include: [
                { model: TicketCategory, as: "category" },
                { model: User, as: "customer", attributes: ["id", "name"] },
                { model: User, as: "agent", attributes: ["id", "name"] },
            ],
            order: [["createdAt", "DESC"]],
        });

        return res.json(tickets);
    } catch (error) {
        console.error("Get My Active Tickets Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};


exports.getUnassignedTickets = async (req, res) => {
    try {
        const tickets = await Ticket.findAll({
            where: {
                agent_id: null,
                status: "open",
            },
            include: [
                { model: TicketCategory, as: "category" },
                { model: User, as: "customer", attributes: ["id", "name"] },
            ],
            order: [["createdAt", "ASC"]],
        });

        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

exports.assignTicketToSelf = async (req, res) => {
    try {
        const agent_id = req.user.id;
        const { ticket_id } = req.params;

        const ticket = await Ticket.findByPk(ticket_id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        if (ticket.agent_id) {
            return res.status(400).json({ message: "Ticket already assigned" });
        }

        await ticket.update({
            agent_id,
            status: "in_progress",
        });

        res.json({ message: "Ticket assigned successfully", ticket });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};


exports.resolveTicket = async (req, res) => {
    try {
        const agent_id = req.user.id;
        const { ticket_id } = req.params;

        const ticket = await Ticket.findOne({
            where: {
                id: ticket_id,
                agent_id,
            },
        });

        if (!ticket) {
            return res.status(403).json({
                message: "You are not assigned to this ticket",
            });
        }

        await ticket.update({
            status: "resolved",
        });

        res.json({ message: "Ticket resolved successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};


exports.getMyResolvedTickets = async (req, res) => {
    try {
        const agent_id = req.user.id;

        const tickets = await Ticket.findAll({
            where: {
                agent_id,
                status: "resolved",
            },
            include: [
                { model: TicketCategory, as: "category" },
                { model: User, as: "customer", attributes: ["id", "name"] },
                { model: User, as: "agent", attributes: ["id", "name"] },
            ],
            order: [["updatedAt", "DESC"]],
        });

        return res.json(tickets);
    } catch (error) {
        console.error("Get My Resolved Tickets Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};
