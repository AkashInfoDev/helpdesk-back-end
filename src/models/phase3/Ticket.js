// src/models/phase3/Ticket.js

module.exports = (sequelize, DataTypes) => {
    const Ticket = sequelize.define(
        "Ticket",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            customer_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            agent_id: {
                type: DataTypes.INTEGER,
                allowNull: true, // agent auto-assigned when they respond
            },

            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false, // customer selects category when creating ticket
            },

            subject: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },

            priority: {
                type: DataTypes.ENUM("low", "medium", "high", "urgent"),
                defaultValue: "low",
            },

            status: {
                type: DataTypes.ENUM(
                    "open",
                    "pending",
                    "in_progress",
                    "resolved",
                    "closed",
                    "reopened"
                ),
                defaultValue: "open",
            },

            sla_due_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            is_overdue: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            tableName: "Ticket",
            timestamps: true,
        }
    );

    return Ticket;
};
