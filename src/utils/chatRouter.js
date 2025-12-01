// src/utils/chatRouter.js

const { User, LiveChatSession, Role } = require("../models");

/**
 * Find the best available agent for a chat session
 * @param {Object} options - Routing options
 * @param {Array} options.requiredSkills - Required skills for this chat
 * @param {String} options.priority - Chat priority (low, medium, high, urgent)
 * @returns {Object|null} - Best agent or null if none available
 */
async function findBestAvailableAgent({ requiredSkills = [], priority = "medium" } = {}) {
    try {
        // Get agent role
        const agentRole = await Role.findOne({ where: { name: "agent" } });
        if (!agentRole) {
            return null;
        }

        // Get all online agents
        const onlineAgents = await User.findAll({
            where: {
                role_id: agentRole.id,
                availability_status: "online",
                status: "active"
            },
            attributes: [
                "id",
                "name",
                "email",
                "availability_status",
                "max_concurrent_chats",
                "skills"
            ]
        });

        if (onlineAgents.length === 0) {
            return null;
        }

        // Calculate workload for each agent
        const agentsWithWorkload = await Promise.all(
            onlineAgents.map(async (agent) => {
                const activeChatCount = await LiveChatSession.count({
                    where: {
                        agent_id: agent.id,
                        status: "active"
                    }
                });

                const isAtCapacity = activeChatCount >= agent.max_concurrent_chats;
                const availableSlots = Math.max(0, agent.max_concurrent_chats - activeChatCount);

                // Calculate skill match score
                let skillMatchScore = 0;
                if (requiredSkills && requiredSkills.length > 0 && agent.skills) {
                    const agentSkills = Array.isArray(agent.skills) ? agent.skills : [];
                    const matchingSkills = requiredSkills.filter(skill =>
                        agentSkills.includes(skill)
                    );
                    skillMatchScore = matchingSkills.length / requiredSkills.length;
                } else if (!requiredSkills || requiredSkills.length === 0) {
                    // No required skills means any agent can handle it
                    skillMatchScore = 1;
                }

                return {
                    agent: agent.toJSON(),
                    activeChatCount,
                    isAtCapacity,
                    availableSlots,
                    skillMatchScore,
                    // Calculate routing score (higher is better)
                    routingScore: calculateRoutingScore({
                        availableSlots,
                        skillMatchScore,
                        activeChatCount,
                        priority
                    })
                };
            })
        );

        // Filter out agents at capacity
        const availableAgents = agentsWithWorkload.filter(a => !a.isAtCapacity);

        if (availableAgents.length === 0) {
            return null;
        }

        // Sort by routing score (highest first)
        availableAgents.sort((a, b) => b.routingScore - a.routingScore);

        // Return best agent
        return {
            agent: availableAgents[0].agent,
            routingInfo: {
                activeChatCount: availableAgents[0].activeChatCount,
                availableSlots: availableAgents[0].availableSlots,
                skillMatchScore: availableAgents[0].skillMatchScore,
                routingScore: availableAgents[0].routingScore
            }
        };

    } catch (error) {
        console.error("Chat Router Error:", error);
        return null;
    }
}

/**
 * Calculate routing score for an agent
 * Higher score = better candidate
 */
function calculateRoutingScore({ availableSlots, skillMatchScore, activeChatCount, priority }) {
    let score = 0;

    // Base score from available slots (more slots = higher score)
    score += availableSlots * 10;

    // Skill match bonus (perfect match = +50, partial = proportional)
    score += skillMatchScore * 50;

    // Lower workload bonus (fewer active chats = higher score)
    score += (10 - Math.min(activeChatCount, 10)) * 2;

    // Priority boost (urgent chats get agents with more available slots)
    const priorityMultiplier = {
        urgent: 1.5,
        high: 1.3,
        medium: 1.0,
        low: 0.8
    };
    score *= priorityMultiplier[priority] || 1.0;

    return score;
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
    try {
        const pendingSessions = await LiveChatSession.findAll({
            where: { status: "pending" },
            order: [
                ["priority", "DESC"], // Urgent first
                ["started_at", "ASC"] // Oldest first
            ]
        });

        const now = new Date();
        const queueStats = pendingSessions.map(session => {
            const waitTime = Math.floor((now - new Date(session.started_at)) / 1000);
            return {
                session_id: session.id,
                wait_time: waitTime,
                priority: session.priority,
                started_at: session.started_at
            };
        });

        return {
            total_in_queue: pendingSessions.length,
            by_priority: {
                urgent: pendingSessions.filter(s => s.priority === "urgent").length,
                high: pendingSessions.filter(s => s.priority === "high").length,
                medium: pendingSessions.filter(s => s.priority === "medium").length,
                low: pendingSessions.filter(s => s.priority === "low").length
            },
            sessions: queueStats
        };
    } catch (error) {
        console.error("Get Queue Stats Error:", error);
        return { total_in_queue: 0, by_priority: {}, sessions: [] };
    }
}

/**
 * Auto-assign pending chats to available agents
 */
async function autoAssignPendingChats() {
    try {
        const pendingSessions = await LiveChatSession.findAll({
            where: { status: "pending" },
            order: [
                ["priority", "DESC"], // Urgent first
                ["started_at", "ASC"] // Oldest first
            ],
            limit: 10 // Process max 10 at a time
        });

        const assigned = [];

        for (const session of pendingSessions) {
            const requiredSkills = session.required_skills || [];
            const priority = session.priority || "medium";

            const bestAgent = await findBestAvailableAgent({
                requiredSkills,
                priority
            });

            if (bestAgent) {
                // Calculate wait time
                const waitTime = Math.floor(
                    (new Date() - new Date(session.started_at)) / 1000
                );

                await session.update({
                    agent_id: bestAgent.agent.id,
                    status: "active",
                    assigned_at: new Date(),
                    wait_time: waitTime
                });

                assigned.push({
                    session_id: session.id,
                    agent_id: bestAgent.agent.id,
                    wait_time: waitTime
                });
            }
        }

        return {
            processed: pendingSessions.length,
            assigned: assigned.length,
            details: assigned
        };
    } catch (error) {
        console.error("Auto Assign Error:", error);
        return { processed: 0, assigned: 0, details: [] };
    }
}

module.exports = {
    findBestAvailableAgent,
    getQueueStats,
    autoAssignPendingChats,
    calculateRoutingScore
};

