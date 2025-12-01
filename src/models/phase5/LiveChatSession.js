module.exports = (sequelize, DataTypes) => {
    const LiveChatSession = sequelize.define("LiveChatSession", {
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        agent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("pending", "active", "closed"),
            defaultValue: "pending",
        },
        priority: {
            type: DataTypes.ENUM("low", "medium", "high", "urgent"),
            defaultValue: "medium",
            comment: "Chat priority for routing",
        },
        required_skills: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
            comment: "Array of required skills for this chat (e.g., ['technical', 'billing'])",
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        source: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ticket_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        }
        ,
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        started_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        assigned_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        ended_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        last_message_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        customer_last_seen_message_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        agent_last_seen_message_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        wait_time: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            comment: "Time in seconds the chat waited in queue",
        },
        transfer_history: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null,
            comment: "Array of transfer records: [{from_agent_id, to_agent_id, transferred_at, reason}]",
        }
    }, {
        tableName: "LiveChatSession",
        timestamps: true,
    });

    return LiveChatSession;
};
