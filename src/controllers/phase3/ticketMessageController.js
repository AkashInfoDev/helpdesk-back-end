// src/controllers/phase3/ticketMessageController.js

const {
    Ticket,
    TicketMessage,
    TicketAttachment,
    User,
} = require("../../models");

// ------------------------------------------------------
// Extract mentions from message text (e.g., "@John Doe")
// ------------------------------------------------------
function extractMentions(message, agentList) {
    if (!message) return [];

    const mentions = [];
    const words = message.split(" ");

    for (const word of words) {
        if (word.startsWith("@")) {
            const name = word.substring(1).trim();

            const agent = agentList.find(
                (a) => a.name.toLowerCase() === name.toLowerCase()
            );

            if (agent) {
                mentions.push({
                    agent_id: agent.id,
                    name: agent.name,
                });
            }
        }
    }

    return mentions;
}

// ------------------------------------------------------
// ADD MESSAGE TO A TICKET
// ------------------------------------------------------
exports.addMessage = async (req, res) => {
    try {
        const { ticket_id } = req.params;
        const { message, internal_note } = req.body;
        const sender_id = req.user.id;
        const sender_role = req.user.role_name; // "customer" or "agent"

        const ticket = await Ticket.findByPk(ticket_id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        // CUSTOMER PERMISSION CHECK
        if (sender_role === "customer" && ticket.customer_id !== sender_id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // AGENT: auto-assign when sending first message
        if (sender_role === "agent" && !ticket.agent_id) {
            ticket.agent_id = sender_id;
            await ticket.save();
        }

        // Parse structured mentions
        const agents = await User.findAll({
            where: { role_id: 2 }, // Assuming 2 = agent
            attributes: ["id", "name"],
        });

        const mentions = extractMentions(message, agents);

        const newMessage = await TicketMessage.create({
            ticket_id,
            sender_id,
            sender_role,
            message,
            internal_note: internal_note || false,
            mentions: mentions.length ? mentions : null,
        });

        return res.status(201).json({
            message: "Message added successfully",
            data: newMessage,
        });
    } catch (error) {
        console.error("Add Message Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};
