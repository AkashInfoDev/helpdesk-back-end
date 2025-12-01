// src/socket/chatSocket.js

const jwt = require("jsonwebtoken");
const {
  LiveChatSession,
  LiveChatMessage,
  User,
  KBArticle,
  Role,
  CannedResponse,
} = require("../models");
const {
  replaceVariables,
} = require("../controllers/phase5/cannedResponseController");

/**
 * Get Customer Context/Preload Data (for Socket.IO)
 */
async function getCustomerContextForSocket(customerId) {
  try {
    const { User, Ticket, LiveChatSession } = require("../models");

    const customer = await User.findByPk(customerId, {
      attributes: ["id", "name", "email", "status", "createdAt"],
    });

    if (!customer) {
      return null;
    }

    const previousTicketsCount = await Ticket.count({
      where: { customer_id: customerId },
    });

    const previousChatsCount = await LiveChatSession.count({
      where: { customer_id: customerId },
    });

    const accountAge = Math.floor(
      (new Date() - new Date(customer.createdAt)) / (1000 * 60 * 60 * 24)
    );

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        status: customer.status,
        account_age_days: accountAge,
      },
      previous_tickets_count: previousTicketsCount,
      previous_chats_count: previousChatsCount,
      account_status: customer.status,
    };
  } catch (error) {
    console.error("Get Customer Context Error:", error);
    return null;
  }
}

module.exports = (io) => {
  // --------------------------------------------
  // Socket.IO Middleware (JWT Authentication)
  // --------------------------------------------
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized: No token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Attach user to socket

      next();
    } catch (err) {
      // Use console.error for socket errors (logger might not be initialized)
      console.error("Socket Auth Error:", err);
      next(new Error("Unauthorized: Invalid token"));
    }
  });

  // --------------------------------------------
  // MAIN CONNECTION EVENT
  // --------------------------------------------
  io.on("connection", async (socket) => {
    console.log(
      `⚡ User connected → ${socket.user.email} (${socket.user.role_name})`
    );

    // ------------------------------------------------------
    // AGENT: Set Online Status on Connect
    // ------------------------------------------------------
    if (socket.user.role_name === "agent") {
      try {
        await User.update(
          {
            availability_status: "online",
            last_activity_at: new Date(),
          },
          { where: { id: socket.user.id } }
        );

        // Broadcast agent status change to admins and other agents
        const agent = await User.findByPk(socket.user.id, {
          attributes: [
            "id",
            "name",
            "email",
            "availability_status",
            "last_activity_at",
          ],
        });

        io.emit("agent:status_changed", {
          agent_id: socket.user.id,
          agent: agent,
          status: "online",
        });
      } catch (err) {
        console.error("Error setting agent online:", err);
      }
    }

    // ------------------------------------------------------
    // CUSTOMER: Start Session (triggered from frontend)
    // ------------------------------------------------------
    socket.on(
      "chat:start",
      async ({ subject, metadata, priority, required_skills }, callback) => {
        try {
          // Get customer context/preload data
          const customerContext = await getCustomerContextForSocket(
            socket.user.id
          );

          // Build enhanced metadata with customer preload
          const enhancedMetadata = {
            ...(metadata || {}),
            customer_preload: {
              customer_name: socket.user.name || socket.user.email,
              customer_email: socket.user.email,
              previous_tickets_count:
                customerContext?.previous_tickets_count || 0,
              previous_chats_count:
                customerContext?.previous_chats_count || 0,
              account_status:
                customerContext?.account_status || "active",
              account_age_days:
                customerContext?.customer?.account_age_days || 0,
              browser_info: metadata?.browser || null,
              page_url: metadata?.page_url || null,
              referrer: metadata?.referrer || null,
              user_agent: metadata?.user_agent || null,
            },
          };

          // Create session as pending - agent will manually accept
          const sessionData = {
            customer_id: socket.user.id,
            subject,
            metadata: enhancedMetadata,
            priority: priority || "medium",
            required_skills: required_skills || null,
            status: "pending", // Always start as pending - no auto-assignment
            started_at: new Date(),
          };

          const session = await LiveChatSession.create(sessionData);

          const room = `session_${session.id}`;
          socket.join(room);

          // Notify all online agents about new pending session
          io.emit("chat:new_session", session);

          callback({
            success: true,
            session,
            message: "Chat session created. Waiting for agent to accept.",
            customer_context: customerContext,
          });
        } catch (err) {
          console.error(err);
          callback({ success: false, message: "Failed to start session" });
        }
      }
    );

    // ------------------------------------------------------
    // JOIN SESSION ROOM (customer or agent)
    // ------------------------------------------------------
    socket.on("chat:join", async ({ session_id }) => {
      const room = `session_${session_id}`;
      socket.join(room);
    });

    // ------------------------------------------------------
    // AGENT: Accept Session
    // ------------------------------------------------------
    socket.on("chat:accept", async ({ session_id }, callback) => {
      try {
        const session = await LiveChatSession.findByPk(session_id);

        if (!session)
          return callback({ success: false, message: "Session not found" });

        if (session.status !== "pending") {
          return callback({ success: false, message: "Already assigned" });
        }

        session.agent_id = socket.user.id;
        session.status = "active";
        session.assigned_at = new Date();
        await session.save();

        const room = `session_${session_id}`;
        socket.join(room);

        io.to(room).emit("chat:session_assigned", {
          session_id,
          agent_id: socket.user.id,
        });

        callback({ success: true });
      } catch (err) {
        console.error(err);
        callback({ success: false });
      }
    });

    // ------------------------------------------------------
    // SEND MESSAGE
    // ------------------------------------------------------
    socket.on("chat:send_message", async (data, callback) => {
      const { session_id, type, content, kb_article_id, attachment_url } = data;

      try {
        // Validate session exists and user has access
        const session = await LiveChatSession.findByPk(session_id);
        if (!session) {
          return callback({ success: false, message: "Session not found" });
        }

        // Check access
        const isCustomer = session.customer_id === socket.user.id;
        const isAgent = session.agent_id === socket.user.id;
        const isAdmin = socket.user.role_name === "admin";

        if (!isCustomer && !isAgent && !isAdmin) {
          return callback({ success: false, message: "Unauthorized" });
        }

        // Validate message type and content
        const validTypes = ["text", "file", "kb_article", "system"];
        if (!validTypes.includes(type)) {
          return callback({ success: false, message: "Invalid message type" });
        }

        // For file type, attachment_url is required
        if (type === "file" && !attachment_url) {
          return callback({
            success: false,
            message: "File URL required for file messages",
          });
        }

        // For text type, content is required
        if (type === "text" && !content) {
          return callback({
            success: false,
            message: "Content required for text messages",
          });
        }

        const message = await LiveChatMessage.create({
          session_id,
          sender_id: socket.user.id,
          sender_role: socket.user.role_name,
          type,
          content: content || null,
          attachment_url: attachment_url || null,
          kb_article_id: kb_article_id || null,
        });

        // Update last message time
        await LiveChatSession.update(
          { last_message_at: new Date() },
          { where: { id: session_id } }
        );

        const fullMessage = await LiveChatMessage.findByPk(message.id, {
          include: [{ model: KBArticle, as: "kb_article" }],
        });

        const room = `session_${session_id}`;
        io.to(room).emit("chat:new_message", fullMessage);

        callback({ success: true, message: fullMessage });
      } catch (err) {
        console.error("Send Message Error:", err);
        callback({ success: false, message: "Failed to send message" });
      }
    });

    // ------------------------------------------------------
    // TYPING EVENT
    // ------------------------------------------------------
    socket.on("chat:typing", ({ session_id, isTyping }) => {
      const room = `session_${session_id}`;
      io.to(room).emit("chat:typing", {
        session_id,
        user_id: socket.user.id,
        role: socket.user.role_name,
        isTyping,
      });
    });

    // ------------------------------------------------------
    // SEEN EVENT
    // ------------------------------------------------------
    socket.on("chat:seen", async ({ session_id, last_seen_message_id }) => {
      try {
        const field =
          socket.user.role_name === "customer"
            ? "customer_last_seen_message_id"
            : "agent_last_seen_message_id";

        await LiveChatSession.update(
          { [field]: last_seen_message_id },
          { where: { id: session_id } }
        );

        const room = `session_${session_id}`;
        io.to(room).emit("chat:seen", {
          session_id,
          user_id: socket.user.id,
          last_seen_message_id,
        });
      } catch (err) {
        console.error(err);
      }
    });

    // ------------------------------------------------------
    // END CHAT
    // ------------------------------------------------------
    // Accepts: ({ session_id }, callback)
    socket.on("chat:end", async ({ session_id }, callback) => {
      try {
        const session = await LiveChatSession.findByPk(session_id);

        if (!session) {
          if (typeof callback === "function")
            return callback({ success: false, message: "Session not found" });
          return;
        }

        // Permission check: allow customer (owner), assigned agent, or admin
        const isCustomer = socket.user.role_name === "customer" && session.customer_id === socket.user.id;
        const isAgent = socket.user.role_name === "agent" && session.agent_id === socket.user.id;
        const isAdmin = socket.user.role_name === "admin";

        if (!isCustomer && !isAgent && !isAdmin) {
          if (typeof callback === "function")
            return callback({ success: false, message: "Unauthorized to end this session" });
          return;
        }

        await LiveChatSession.update(
          {
            status: "closed",
            ended_at: new Date(),
          },
          { where: { id: session_id } }
        );

        const room = `session_${session_id}`;
        io.to(room).emit("chat:ended", {
          session_id,
          ended_by: socket.user.role_name,
        });

        if (typeof callback === "function") callback({ success: true });
      } catch (err) {
        console.error("End Chat Error:", err);
        if (typeof callback === "function") callback({ success: false, message: "Failed to end session" });
      }
    });

    // ------------------------------------------------------
    // AGENT: Update Availability Status (Real-time)
    // ------------------------------------------------------
    socket.on(
      "agent:update_status",
      async ({ availability_status }, callback) => {
        try {
          // Only agents can update status
          if (socket.user.role_name !== "agent") {
            return callback({
              success: false,
              message: "Only agents can update status",
            });
          }

          const validStatuses = ["online", "offline", "busy", "away"];
          if (!validStatuses.includes(availability_status)) {
            return callback({ success: false, message: "Invalid status" });
          }

          await User.update(
            {
              availability_status,
              last_activity_at: new Date(),
            },
            { where: { id: socket.user.id } }
          );

          const agent = await User.findByPk(socket.user.id, {
            attributes: [
              "id",
              "name",
              "email",
              "availability_status",
              "last_activity_at",
            ],
          });

          // Broadcast status change to admins and other agents
          io.emit("agent:status_changed", {
            agent_id: socket.user.id,
            agent: agent,
            status: availability_status,
          });

          callback({ success: true, agent });
        } catch (err) {
          console.error("Update Status Error:", err);
          callback({ success: false, message: "Failed to update status" });
        }
      }
    );

    // ------------------------------------------------------
    // AGENT: Activity Ping (for auto-away detection)
    // ------------------------------------------------------
    socket.on("agent:activity_ping", async () => {
      try {
        if (socket.user.role_name === "agent") {
          const user = await User.findByPk(socket.user.id);

          // If agent is "away", set back to "online" on activity
          if (user.availability_status === "away") {
            await User.update(
              {
                availability_status: "online",
                last_activity_at: new Date(),
              },
              { where: { id: socket.user.id } }
            );

            const agent = await User.findByPk(socket.user.id, {
              attributes: [
                "id",
                "name",
                "email",
                "availability_status",
                "last_activity_at",
              ],
            });

            io.emit("agent:status_changed", {
              agent_id: socket.user.id,
              agent: agent,
              status: "online",
            });
          } else {
            // Just update activity timestamp
            await User.update(
              { last_activity_at: new Date() },
              { where: { id: socket.user.id } }
            );
          }
        }
      } catch (err) {
        console.error("Activity Ping Error:", err);
      }
    });

    // ------------------------------------------------------
    // ADMIN/AGENT: Get All Agents Status (Real-time)
    // ------------------------------------------------------
    socket.on("agent:get_all_status", async (callback) => {
      try {
        // Only admins and agents can request this
        if (!["admin", "agent"].includes(socket.user.role_name)) {
          return callback({ success: false, message: "Unauthorized" });
        }

        const agentRole = await Role.findOne({ where: { name: "agent" } });
        if (!agentRole) {
          return callback({ success: true, agents: [] });
        }

        const agents = await User.findAll({
          where: { role_id: agentRole.id },
          attributes: [
            "id",
            "name",
            "email",
            "availability_status",
            "last_activity_at",
            "max_concurrent_chats",
          ],
        });

        // Get active chat count for each agent
        const agentsWithWorkload = await Promise.all(
          agents.map(async (agent) => {
            const activeChatCount = await LiveChatSession.count({
              where: {
                agent_id: agent.id,
                status: "active",
              },
            });

            return {
              ...agent.toJSON(),
              current_active_chats: activeChatCount,
              is_at_capacity: activeChatCount >= agent.max_concurrent_chats,
              available_slots: Math.max(
                0,
                agent.max_concurrent_chats - activeChatCount
              ),
            };
          })
        );

        callback({ success: true, agents: agentsWithWorkload });
      } catch (err) {
        console.error("Get All Status Error:", err);
        callback({ success: false, message: "Failed to get agents status" });
      }
    });

    // ------------------------------------------------------
    // AGENT: Use Canned Response in Chat
    // ------------------------------------------------------
    socket.on("chat:use_canned_response", async (data, callback) => {
      try {
        const { session_id, response_id, variables } = data;

        // Only agents can use canned responses
        if (socket.user.role_name !== "agent") {
          return callback({
            success: false,
            message: "Only agents can use canned responses",
          });
        }

        // Get canned response
        const response = await CannedResponse.findByPk(response_id);

        if (!response) {
          return callback({
            success: false,
            message: "Canned response not found",
          });
        }

        // Check access
        if (!response.is_shared && response.created_by !== socket.user.id) {
          return callback({
            success: false,
            message: "Access denied",
          });
        }

        // Replace variables
        const processedContent = replaceVariables(
          response.content,
          variables || {}
        );

        // Increment usage count
        await response.increment("usage_count");

        // Send as regular message
        const message = await LiveChatMessage.create({
          session_id,
          sender_id: socket.user.id,
          sender_role: socket.user.role_name,
          type: "text",
          content: processedContent,
        });

        // Update last message time
        await LiveChatSession.update(
          { last_message_at: new Date() },
          { where: { id: session_id } }
        );

        const fullMessage = await LiveChatMessage.findByPk(message.id);

        const room = `session_${session_id}`;
        io.to(room).emit("chat:new_message", fullMessage);

        callback({
          success: true,
          message: fullMessage,
          canned_response: {
            id: response.id,
            title: response.title,
          },
        });
      } catch (err) {
        console.error("Use Canned Response Error:", err);
        callback({ success: false, message: "Failed to use canned response" });
      }
    });

    // ------------------------------------------------------
    // TRANSFER CHAT TO ANOTHER AGENT
    // ------------------------------------------------------
    socket.on("chat:transfer", async (data, callback) => {
      try {
        const { session_id, to_agent_id, reason } = data;
        const fromAgentId = socket.user.id;

        if (!to_agent_id) {
          return callback({
            success: false,
            message: "to_agent_id is required",
          });
        }

        const session = await LiveChatSession.findByPk(session_id);
        if (!session) {
          return callback({
            success: false,
            message: "Session not found",
          });
        }

        if (session.status === "closed") {
          return callback({
            success: false,
            message: "Cannot transfer closed session",
          });
        }

        // Check permissions
        const isCurrentAgent = session.agent_id === fromAgentId;
        const isAdmin = socket.user.role_name === "admin";

        if (!isCurrentAgent && !isAdmin) {
          return callback({
            success: false,
            message: "Only assigned agent or admin can transfer",
          });
        }

        // Verify target agent
        const toAgent = await User.findByPk(to_agent_id);
        if (!toAgent) {
          return callback({
            success: false,
            message: "Target agent not found",
          });
        }

        // Check capacity
        const activeChatCount = await LiveChatSession.count({
          where: {
            agent_id: to_agent_id,
            status: "active",
          },
        });

        if (activeChatCount >= toAgent.max_concurrent_chats) {
          return callback({
            success: false,
            message: "Target agent is at maximum capacity",
          });
        }

        // Update transfer history
        const transferHistory = session.transfer_history || [];
        const fromAgentIdValue = session.agent_id;

        transferHistory.push({
          from_agent_id: fromAgentIdValue,
          to_agent_id: to_agent_id,
          transferred_at: new Date().toISOString(),
          reason: reason || null,
          transferred_by: fromAgentId,
        });

        // Update session
        await session.update({
          agent_id: to_agent_id,
          assigned_at: new Date(),
          transfer_history: transferHistory,
        });

        // Add system message
        await LiveChatMessage.create({
          session_id: session_id,
          sender_id: null,
          sender_role: "system",
          type: "system",
          content: `Chat transferred from Agent ${fromAgentIdValue} to Agent ${to_agent_id}${reason ? `: ${reason}` : ""
            }`,
        });

        // Notify both agents and customer
        const room = `session_${session_id}`;
        io.to(room).emit("chat:transferred", {
          session_id,
          from_agent_id: fromAgentIdValue,
          to_agent_id: to_agent_id,
          reason,
        });

        // Notify new agent
        io.emit("chat:new_session_assigned", {
          session,
          agent_id: to_agent_id,
        });

        callback({
          success: true,
          message: "Chat transferred successfully",
          session,
        });
      } catch (err) {
        console.error("Transfer Chat Error:", err);
        callback({
          success: false,
          message: "Failed to transfer chat",
        });
      }
    });

    // --------------------------------------------
    // DISCONNECT
    // --------------------------------------------
    socket.on("disconnect", async () => {
      console.log(`❌ User disconnected → ${socket.user.email}`);

      // If agent disconnects, set status to offline
      if (socket.user.role_name === "agent") {
        try {
          await User.update(
            {
              availability_status: "offline",
              last_activity_at: new Date(),
            },
            { where: { id: socket.user.id } }
          );

          const agent = await User.findByPk(socket.user.id, {
            attributes: ["id", "name", "email", "availability_status"],
          });

          // Broadcast agent went offline
          io.emit("agent:status_changed", {
            agent_id: socket.user.id,
            agent: agent,
            status: "offline",
          });
        } catch (err) {
          console.error("Error setting agent offline:", err);
        }
      }
    });
  });
};
