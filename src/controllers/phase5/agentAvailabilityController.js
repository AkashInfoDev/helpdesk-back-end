// src/controllers/phase5/agentAvailabilityController.js

const { User, LiveChatSession, Role } = require("../../models");

// ----------------------------------------
// AGENT: Update My Availability Status
// ----------------------------------------
exports.updateMyStatus = async (req, res) => {
  try {
    const { availability_status } = req.body;
    const agentId = req.user.id;

    // Validate status
    const validStatuses = ["online", "offline", "busy", "away"];
    if (!validStatuses.includes(availability_status)) {
      return res.status(400).json({
        message: "Invalid status. Must be: online, offline, busy, or away",
      });
    }

    // Verify user is an agent
    const user = await User.findByPk(agentId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is an agent (check by role name)
    const role = await Role.findByPk(user.role_id);
    if (role && role.name !== "agent") {
      return res.status(403).json({
        message: "Only agents can update availability status",
      });
    }

    // Update status and activity timestamp
    await User.update(
      {
        availability_status,
        last_activity_at: new Date(),
      },
      { where: { id: agentId } }
    );

    // Get updated user
    const updatedUser = await User.findByPk(agentId, {
      attributes: [
        "id",
        "name",
        "email",
        "availability_status",
        "last_activity_at",
        "max_concurrent_chats",
      ],
    });

    res.json({
      success: true,
      message: "Availability status updated",
      agent: updatedUser,
    });
  } catch (err) {
    console.error("Update Status Error:", err);
    res.status(500).json({ message: "Failed to update availability status" });
  }
};

// ----------------------------------------
// AGENT: Update Max Concurrent Chats
// ----------------------------------------
exports.updateMaxConcurrentChats = async (req, res) => {
  try {
    const { max_concurrent_chats } = req.body;
    const agentId = req.user.id;

    // Validate
    if (
      typeof max_concurrent_chats !== "number" ||
      max_concurrent_chats < 1 ||
      max_concurrent_chats > 20
    ) {
      return res.status(400).json({
        message: "max_concurrent_chats must be a number between 1 and 20",
      });
    }

    // Verify user is an agent
    const user = await User.findByPk(agentId);
    const role = await Role.findByPk(user.role_id);

    if (role && role.name !== "agent") {
      return res.status(403).json({
        message: "Only agents can update max concurrent chats",
      });
    }

    // Update
    await User.update({ max_concurrent_chats }, { where: { id: agentId } });

    const updatedUser = await User.findByPk(agentId, {
      attributes: ["id", "name", "max_concurrent_chats"],
    });

    res.json({
      success: true,
      message: "Max concurrent chats updated",
      agent: updatedUser,
    });
  } catch (err) {
    console.error("Update Max Chats Error:", err);
    res.status(500).json({ message: "Failed to update max concurrent chats" });
  }
};

// ----------------------------------------
// AGENT: Get My Current Status & Workload
// ----------------------------------------
exports.getMyStatus = async (req, res) => {
  try {
    const agentId = req.user.id;

    const agent = await User.findByPk(agentId, {
      attributes: [
        "id",
        "name",
        "email",
        "availability_status",
        "last_activity_at",
        "max_concurrent_chats",
      ],
    });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // Get current active chat count
    const activeChatCount = await LiveChatSession.count({
      where: {
        agent_id: agentId,
        status: "active",
      },
    });

    // Calculate if agent is at capacity
    const isAtCapacity = activeChatCount >= agent.max_concurrent_chats;

    res.json({
      success: true,
      agent: {
        ...agent.toJSON(),
        current_active_chats: activeChatCount,
        is_at_capacity: isAtCapacity,
        available_slots: Math.max(
          0,
          agent.max_concurrent_chats - activeChatCount
        ),
      },
    });
  } catch (err) {
    console.error("Get Status Error:", err);
    res.status(500).json({ message: "Failed to get agent status" });
  }
};

// ----------------------------------------
// ADMIN/SUPERVISOR: Get All Agents Status
// ----------------------------------------
exports.getAllAgentsStatus = async (req, res) => {
  try {
    // Get all agents (role_id = 2, or check by role name)
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
        "last_activity_at",
        "max_concurrent_chats",
      ],
      order: [
        ["availability_status", "ASC"],
        ["name", "ASC"],
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

    // Calculate summary statistics
    const summary = {
      total_agents: agentsWithWorkload.length,
      online: agentsWithWorkload.filter(
        (a) => a.availability_status === "online"
      ).length,
      offline: agentsWithWorkload.filter(
        (a) => a.availability_status === "offline"
      ).length,
      busy: agentsWithWorkload.filter((a) => a.availability_status === "busy")
        .length,
      away: agentsWithWorkload.filter((a) => a.availability_status === "away")
        .length,
      total_active_chats: agentsWithWorkload.reduce(
        (sum, a) => sum + a.current_active_chats,
        0
      ),
    };

    res.json({
      success: true,
      agents: agentsWithWorkload,
      summary,
    });
  } catch (err) {
    console.error("Get All Agents Status Error:", err);
    res.status(500).json({ message: "Failed to get agents status" });
  }
};

// ----------------------------------------
// ADMIN: Update Agent Status (Manual Override)
// ----------------------------------------
exports.updateAgentStatus = async (req, res) => {
  try {
    const { agent_id } = req.params;
    const { availability_status } = req.body;

    // Validate status
    const validStatuses = ["online", "offline", "busy", "away"];
    if (!validStatuses.includes(availability_status)) {
      return res.status(400).json({
        message: "Invalid status. Must be: online, offline, busy, or away",
      });
    }

    // Check if agent exists
    const agent = await User.findByPk(agent_id);
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // Update
    await User.update(
      {
        availability_status,
        last_activity_at: new Date(),
      },
      { where: { id: agent_id } }
    );

    const updatedAgent = await User.findByPk(agent_id, {
      attributes: [
        "id",
        "name",
        "email",
        "availability_status",
        "last_activity_at",
      ],
    });

    res.json({
      success: true,
      message: "Agent status updated",
      agent: updatedAgent,
    });
  } catch (err) {
    console.error("Admin Update Agent Status Error:", err);
        res.status(500).json({ message: "Failed to update agent status" });
    }
};

// ----------------------------------------
// AGENT: Update My Skills
// ----------------------------------------
exports.updateMySkills = async (req, res) => {
    try {
        const { skills } = req.body;
        const agentId = req.user.id;

        // Validate skills is an array
        if (skills !== undefined && !Array.isArray(skills)) {
            return res.status(400).json({
                message: "Skills must be an array"
            });
        }

        // Verify user is an agent
        const user = await User.findByPk(agentId);
        const role = await Role.findByPk(user.role_id);
        
        if (role && role.name !== "agent") {
            return res.status(403).json({
                message: "Only agents can update skills"
            });
        }

        // Update skills
        await User.update(
            { skills: skills || [] },
            { where: { id: agentId } }
        );

        const updatedUser = await User.findByPk(agentId, {
            attributes: ["id", "name", "skills"]
        });

        res.json({
            success: true,
            message: "Skills updated",
            agent: updatedUser
        });

    } catch (err) {
        console.error("Update Skills Error:", err);
        res.status(500).json({ message: "Failed to update skills" });
    }
};

// ----------------------------------------
// ADMIN: Update Agent Skills
// ----------------------------------------
exports.updateAgentSkills = async (req, res) => {
    try {
        const { agent_id } = req.params;
        const { skills } = req.body;

        // Validate skills is an array
        if (skills !== undefined && !Array.isArray(skills)) {
            return res.status(400).json({
                message: "Skills must be an array"
            });
        }

        // Check if agent exists
        const agent = await User.findByPk(agent_id);
        if (!agent) {
            return res.status(404).json({ message: "Agent not found" });
        }

        // Update
        await User.update(
            { skills: skills || [] },
            { where: { id: agent_id } }
        );

        const updatedAgent = await User.findByPk(agent_id, {
            attributes: ["id", "name", "email", "skills"]
        });

        res.json({
            success: true,
            message: "Agent skills updated",
            agent: updatedAgent
        });

    } catch (err) {
        console.error("Admin Update Agent Skills Error:", err);
        res.status(500).json({ message: "Failed to update agent skills" });
    }
};
