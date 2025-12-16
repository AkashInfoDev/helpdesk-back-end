// src/controllers/phase5/liveChatController.js

const {
    LiveChatSession,
    LiveChatMessage,
    User,
    KBArticle,
    Ticket,
    TicketMessage,
    Sequelize,
    TicketCategory,
} = require("../../models");
const { Op } = Sequelize;
const { getQueueStats } = require("../../utils/chatRouter");
// const { findBestAvailableAgent, autoAssignPendingChats } = require("../../utils/chatRouter"); // DISABLED - Manual assignment only

/**
 * Get Customer Context/Preload Data
 */
async function getCustomerContext(customerId) {
    try {
        const customer = await User.findByPk(customerId, {
            attributes: ["id", "name", "email", "status", "createdAt"]
        });

        if (!customer) {
            return null;
        }

        // Get previous tickets count
        const previousTicketsCount = await Ticket.count({
            where: { customer_id: customerId }
        });

        // Get recent tickets (last 5)
        const recentTickets = await Ticket.findAll({
            where: { customer_id: customerId },
            attributes: ["id", "subject", "status", "priority", "createdAt"],
            order: [["createdAt", "DESC"]],
            limit: 5
        });

        // Get previous chat sessions count
        const previousChatsCount = await LiveChatSession.count({
            where: { customer_id: customerId }
        });

        // Get recent chat sessions (last 3)
        const recentChats = await LiveChatSession.findAll({
            where: { customer_id: customerId },
            attributes: ["id", "subject", "status", "started_at", "ended_at"],
            order: [["started_at", "DESC"]],
            limit: 3
        });

        // Calculate account age (days since registration)
        const accountAge = Math.floor(
            (new Date() - new Date(customer.createdAt)) / (1000 * 60 * 60 * 24)
        );

        return {
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                status: customer.status,
                account_age_days: accountAge
            },
            previous_tickets_count: previousTicketsCount,
            recent_tickets: recentTickets,
            previous_chats_count: previousChatsCount,
            recent_chats: recentChats,
            account_status: customer.status
        };
    } catch (error) {
        console.error("Get Customer Context Error:", error);
        return null;
    }
}

// ----------------------------------------
// CUSTOMER: Start New Live Chat Session
// ----------------------------------------
// exports.startSession = async (req, res) => {
//     try {
//         const { subject, metadata, priority, required_skills, category_id } = req.body;

//         // Get customer context/preload data
//         const customerContext = await getCustomerContext(req.user.id);

//         // Build enhanced metadata with customer preload
//         const enhancedMetadata = {
//             ...(metadata || {}),
//             customer_preload: {
//                 customer_name: req.user.name,
//                 customer_email: req.user.email,
//                 previous_tickets_count: customerContext?.previous_tickets_count || 0,
//                 previous_chats_count: customerContext?.previous_chats_count || 0,
//                 account_status: customerContext?.account_status || "active",
//                 account_age_days: customerContext?.customer?.account_age_days || 0,
//                 browser_info: metadata?.browser || null,
//                 page_url: metadata?.page_url || null,
//                 referrer: metadata?.referrer || null,
//                 ip_address: req.ip || null,
//                 user_agent: req.get('user-agent') || null
//             }
//         };

//         // Create session as pending - agent will manually accept
//         const sessionData = {
//             customer_id: req.user.id,
//             subject,
//             metadata: enhancedMetadata,
//             priority: priority || "medium",
//             required_skills: required_skills || null,
//             status: "pending", // Always start as pending - no auto-assignment
//             started_at: new Date()
//         };

//         const session = await LiveChatSession.create(sessionData);

//         return res.json({
//             success: true,
//             session,
//             message: "Chat session created. Waiting for agent to accept.",
//             customer_context: customerContext
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Failed to start session" });
//     }
// };
exports.startSession = async (req, res) => {
    try {
        const {
            subject,
            metadata,
            priority,
            required_skills,
            category_id
        } = req.body;

        let category = null;

        // 🧠 Validate category ONLY if provided
        if (category_id) {
            category = await TicketCategory.findByPk(category_id);
            if (!category) {
                return res.status(400).json({
                    message: "Invalid category_id"
                });
            }
        }

        // 📊 Get customer context / preload data
        const customerContext = await getCustomerContext(req.user.id);

        // 🧩 Build enhanced metadata
        const enhancedMetadata = {
            ...(metadata || {}),
            customer_preload: {
                customer_name: req.user.name,
                customer_email: req.user.email,
                previous_tickets_count: customerContext?.previous_tickets_count || 0,
                previous_chats_count: customerContext?.previous_chats_count || 0,
                account_status: customerContext?.account_status || "active",
                account_age_days: customerContext?.customer?.account_age_days || 0,
                browser_info: metadata?.browser || null,
                page_url: metadata?.page_url || null,
                referrer: metadata?.referrer || null,
                ip_address: req.ip || null,
                user_agent: req.get("user-agent") || null
            }
        };

        // 🧾 Create chat session (PENDING)
        const sessionData = {
            customer_id: req.user.id,
            subject,
            category_id: category_id || null, // ✅ OPTIONAL
            metadata: enhancedMetadata,
            priority: priority || "medium",
            required_skills: required_skills || null,
            status: "pending",
            started_at: new Date()
        };

        const session = await LiveChatSession.create(sessionData);

        return res.json({
            success: true,
            message: "Chat session created. Waiting for agent to accept.",
            session,
            category: category
                ? { id: category.id, name: category.name }
                : null,
            customer_context: customerContext
        });

    } catch (err) {
        console.error("Start Session Error:", err);
        res.status(500).json({
            message: "Failed to start session"
        });
    }
};

// ----------------------------------------
// CUSTOMER: Get My Sessions
// ----------------------------------------
exports.getMySessions = async (req, res) => {
    try {
        const sessions = await LiveChatSession.findAll({
            where: { customer_id: req.user.id },
            order: [["started_at", "DESC"]],
        });

        res.json({ success: true, sessions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch sessions" });
    }
};

// ----------------------------------------
// AGENT: Get Assigned or Pending Sessions
// ----------------------------------------
exports.getAgentSessions = async (req, res) => {
    try {
        const { status } = req.query;

        const where = {};

        // If status is "pending", show all pending (for queue)
        // Otherwise, show only this agent's sessions
        if (status === "pending") {
            where.status = "pending";
        } else {
            where.agent_id = req.user.id;
            if (status) where.status = status;
        }

        const sessions = await LiveChatSession.findAll({
            where,
            order: [
                ["priority", "DESC"], // Urgent first
                ["started_at", "ASC"] // Oldest first
            ],
        });

        res.json({ success: true, sessions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch agent sessions" });
    }
};

// ----------------------------------------
// ADMIN: Get All Sessions
// ----------------------------------------
exports.getAllSessions = async (req, res) => {
    try {
        const sessions = await LiveChatSession.findAll({
            order: [["started_at", "DESC"]],
        });

        res.json({ success: true, sessions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch sessions" });
    }
};

// ----------------------------------------
// Get Messages of a Session
// ----------------------------------------
exports.getSessionMessages = async (req, res) => {
    try {
        const { id } = req.params;

        const messages = await LiveChatMessage.findAll({
            where: { session_id: id },
            include: [
                {
                    model: KBArticle,
                    as: "kb_article",
                }
            ],
            order: [["createdAt", "ASC"]],
        });

        res.json({ success: true, messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load messages" });
    }
};

// ----------------------------------------
// Convert Chat → Ticket (Agent/Admin)
// ----------------------------------------
exports.convertToTicket = async (req, res) => {
    try {
        const { id } = req.params;

        // Accept optional fields from request body
        const { category_id, priority, subject } = req.body || {};

        const session = await LiveChatSession.findByPk(id, {
            include: [{ model: LiveChatMessage, as: "messages" }]
        });

        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.ticket_id) {
            return res.json({
                success: true,
                message: "Ticket already created",
                ticket_id: session.ticket_id
            });
        }

        const customerId = session.customer_id;
        const agentId = session.agent_id;

        // Require category_id to be provided when converting chat to ticket
        if (!category_id) {
            return res.status(400).json({ message: "category_id is required to convert chat to ticket" });
        }

        // Validate category exists
        const category = await TicketCategory.findByPk(category_id);
        if (!category) {
            return res.status(400).json({ message: "Invalid category_id" });
        }

        const ticketSubject = subject || session.subject || "Support via Live Chat";

        // Build readable transcript
        let description = "";
        session.messages.forEach(msg => {
            description += `[${msg.sender_role}] ${msg.content || ""}\n`;
        });

        // Create Ticket with provided category_id and optional priority/subject
        const newTicket = await Ticket.create({
            customer_id: customerId,
            agent_id: agentId,
            category_id: category_id,
            subject: ticketSubject,
            description,
            priority: priority || "medium",
            status: "open",
        });

        // Add system message
        await TicketMessage.create({
            ticket_id: newTicket.id,
            sender_id: agentId,
            sender_role: "agent",
            message: "Ticket created from Live Chat"
        });

        // Link chat to ticket
        session.ticket_id = newTicket.id;
        await session.save();

        res.json({
            success: true,
            ticket_id: newTicket.id,
            message: "Chat converted to ticket"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to convert chat to ticket" });
    }
};

// ----------------------------------------
// Get Queue Statistics
// ----------------------------------------
exports.getQueueStats = async (req, res) => {
    try {
        const stats = await getQueueStats();
        res.json({ success: true, ...stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to get queue stats" });
    }
};

// ----------------------------------------
// Auto-Assign Pending Chats (DISABLED - Manual assignment only)
// ----------------------------------------
// exports.autoAssignChats = async (req, res) => {
//     try {
//         const result = await autoAssignPendingChats();
//         res.json({
//             success: true,
//             message: `Processed ${result.processed} chats, assigned ${result.assigned}`,
//             ...result
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Failed to auto-assign chats" });
//     }
// };

// ----------------------------------------
// ADMIN: Manually Assign Chat to Agent
// ----------------------------------------
exports.manualAssignChat = async (req, res) => {
    try {
        const { id } = req.params;
        const { agent_id } = req.body;

        if (!agent_id) {
            return res.status(400).json({ message: "agent_id is required" });
        }

        const session = await LiveChatSession.findByPk(id);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.status !== "pending") {
            return res.status(400).json({ message: "Session is not pending" });
        }

        // Verify agent exists and is online
        const agent = await User.findByPk(agent_id);
        if (!agent || agent.availability_status !== "online") {
            return res.status(400).json({ message: "Agent not available" });
        }

        // Calculate wait time
        const waitTime = Math.floor(
            (new Date() - new Date(session.started_at)) / 1000
        );

        await session.update({
            agent_id,
            status: "active",
            assigned_at: new Date(),
            wait_time: waitTime
        });

        res.json({
            success: true,
            message: "Chat assigned successfully",
            session
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to assign chat" });
    }
};

// ----------------------------------------
// Transfer Chat to Another Agent
// ----------------------------------------
exports.transferChat = async (req, res) => {
    try {
        const { id } = req.params;
        const { to_agent_id, reason } = req.body;
        const fromAgentId = req.user.id;

        if (!to_agent_id) {
            return res.status(400).json({ message: "to_agent_id is required" });
        }

        const session = await LiveChatSession.findByPk(id);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.status === "closed") {
            return res.status(400).json({ message: "Cannot transfer closed session" });
        }

        // Check if user has permission to transfer
        const isCurrentAgent = session.agent_id === fromAgentId;
        const isAdmin = req.user.role_name === "admin";

        if (!isCurrentAgent && !isAdmin) {
            return res.status(403).json({
                message: "Only the assigned agent or admin can transfer this chat"
            });
        }

        // Verify target agent exists and is available
        const toAgent = await User.findByPk(to_agent_id);
        if (!toAgent) {
            return res.status(404).json({ message: "Target agent not found" });
        }

        // Check if target agent is at capacity
        const activeChatCount = await LiveChatSession.count({
            where: {
                agent_id: to_agent_id,
                status: "active"
            }
        });

        if (activeChatCount >= toAgent.max_concurrent_chats) {
            return res.status(400).json({
                message: "Target agent is at maximum capacity"
            });
        }

        // Get current transfer history
        const transferHistory = session.transfer_history || [];
        const fromAgentIdValue = session.agent_id;

        // Add transfer record
        transferHistory.push({
            from_agent_id: fromAgentIdValue,
            to_agent_id: to_agent_id,
            transferred_at: new Date().toISOString(),
            reason: reason || null,
            transferred_by: fromAgentId
        });

        // Update session
        await session.update({
            agent_id: to_agent_id,
            assigned_at: new Date(),
            transfer_history: transferHistory
        });

        // Add system message about transfer
        await LiveChatMessage.create({
            session_id: id,
            sender_id: null,
            sender_role: "system",
            type: "system",
            content: `Chat transferred from Agent ${fromAgentIdValue} to Agent ${to_agent_id}${reason ? `: ${reason}` : ""}`
        });

        res.json({
            success: true,
            message: "Chat transferred successfully",
            session,
            transfer_info: {
                from_agent_id: fromAgentIdValue,
                to_agent_id: to_agent_id,
                reason
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to transfer chat" });
    }
};

// ----------------------------------------
// Get Agent Workload Statistics
// ----------------------------------------
exports.getAgentWorkload = async (req, res) => {
    try {
        const { agent_id } = req.params;
        const requestingUserId = req.user.id;
        const requestingUserRole = req.user.role_name;

        // Check permissions
        if (requestingUserRole !== "admin" && requestingUserId !== parseInt(agent_id)) {
            return res.status(403).json({
                message: "You can only view your own workload"
            });
        }

        const agent = await User.findByPk(agent_id, {
            attributes: [
                "id",
                "name",
                "email",
                "availability_status",
                "max_concurrent_chats"
            ]
        });

        if (!agent) {
            return res.status(404).json({ message: "Agent not found" });
        }

        // Get active chats
        const activeChats = await LiveChatSession.findAll({
            where: {
                agent_id: agent_id,
                status: "active"
            },
            attributes: ["id", "subject", "priority", "started_at", "last_message_at"],
            order: [["priority", "DESC"], ["last_message_at", "DESC"]]
        });

        // Get pending chats assigned to this agent (if any)
        const pendingChats = await LiveChatSession.count({
            where: {
                agent_id: agent_id,
                status: "pending"
            }
        });

        // Get closed chats today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const closedToday = await LiveChatSession.count({
            where: {
                agent_id: agent_id,
                status: "closed",
                ended_at: {
                    [Op.gte]: today
                }
            }
        });

        // Calculate statistics
        const activeCount = activeChats.length;
        const isAtCapacity = activeCount >= agent.max_concurrent_chats;
        const availableSlots = Math.max(0, agent.max_concurrent_chats - activeCount);

        res.json({
            success: true,
            agent: {
                ...agent.toJSON(),
                current_active_chats: activeCount,
                pending_chats: pendingChats,
                closed_today: closedToday,
                is_at_capacity: isAtCapacity,
                available_slots: availableSlots,
                utilization_percentage: agent.max_concurrent_chats > 0
                    ? Math.round((activeCount / agent.max_concurrent_chats) * 100)
                    : 0
            },
            active_chats: activeChats
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to get agent workload" });
    }
};

// ----------------------------------------
// Get All Agents Workload (Admin)
// ----------------------------------------
exports.getAllAgentsWorkload = async (req, res) => {
    try {
        const { Role } = require("../../models");
        const agentRole = await Role.findOne({ where: { name: "agent" } });

        if (!agentRole) {
            return res.json({ success: true, agents: [] });
        }

        const agents = await User.findAll({
            where: { role_id: agentRole.id },
            attributes: [
                "id",
                "name",
                "email",
                "availability_status",
                "max_concurrent_chats"
            ]
        });

        const agentsWithWorkload = await Promise.all(
            agents.map(async (agent) => {
                const activeCount = await LiveChatSession.count({
                    where: {
                        agent_id: agent.id,
                        status: "active"
                    }
                });

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const closedToday = await LiveChatSession.count({
                    where: {
                        agent_id: agent.id,
                        status: "closed",
                        ended_at: {
                            [Op.gte]: today
                        }
                    }
                });

                return {
                    ...agent.toJSON(),
                    current_active_chats: activeCount,
                    closed_today: closedToday,
                    is_at_capacity: activeCount >= agent.max_concurrent_chats,
                    available_slots: Math.max(0, agent.max_concurrent_chats - activeCount),
                    utilization_percentage: agent.max_concurrent_chats > 0
                        ? Math.round((activeCount / agent.max_concurrent_chats) * 100)
                        : 0
                };
            })
        );

        res.json({
            success: true,
            agents: agentsWithWorkload,
            summary: {
                total_agents: agentsWithWorkload.length,
                total_active_chats: agentsWithWorkload.reduce((sum, a) => sum + a.current_active_chats, 0),
                total_available_slots: agentsWithWorkload.reduce((sum, a) => sum + a.available_slots, 0),
                agents_at_capacity: agentsWithWorkload.filter(a => a.is_at_capacity).length
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to get agents workload" });
    }
};

// ----------------------------------------
// Get Customer Context for Chat Session
// ----------------------------------------
exports.getCustomerContext = async (req, res) => {
    try {
        const { id } = req.params; // session_id
        const userId = req.user.id;
        const userRole = req.user.role_name;

        // Get session
        const session = await LiveChatSession.findByPk(id);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        // Check access: customer can only see their own, agent/admin can see any
        if (userRole === "customer" && session.customer_id !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Get customer context
        const customerContext = await getCustomerContext(session.customer_id);

        if (!customerContext) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Get customer's current active tickets
        const activeTickets = await Ticket.findAll({
            where: {
                customer_id: session.customer_id,
                status: {
                    [Op.in]: ["open", "pending", "in_progress", "reopened"]
                }
            },
            attributes: ["id", "subject", "status", "priority", "createdAt"],
            order: [["createdAt", "DESC"]],
            limit: 5
        });

        // Get customer's current active chats
        const activeChats = await LiveChatSession.findAll({
            where: {
                customer_id: session.customer_id,
                status: {
                    [Op.in]: ["pending", "active"]
                },
                id: {
                    [Op.ne]: session.id // Exclude current session
                }
            },
            attributes: ["id", "subject", "status", "started_at"],
            order: [["started_at", "DESC"]]
        });

        res.json({
            success: true,
            customer_context: {
                ...customerContext,
                active_tickets: activeTickets,
                active_chats: activeChats
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to get customer context" });
    }
};
