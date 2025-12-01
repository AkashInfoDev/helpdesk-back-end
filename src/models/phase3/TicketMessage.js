// src/models/phase3/TicketMessage.js

module.exports = (sequelize, DataTypes) => {
    const TicketMessage = sequelize.define(
        "TicketMessage",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            ticket_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            sender_id: {
                type: DataTypes.INTEGER,
                allowNull: false, // Customer or agent
            },

            sender_role: {
                type: DataTypes.ENUM("customer", "agent"),
                allowNull: false,
            },

            message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            internal_note: {
                type: DataTypes.BOOLEAN,
                defaultValue: false, // only visible to agents
            },

            // NEW FEATURE: STRUCTURED MENTIONS
            mentions: {
                type: DataTypes.JSON, // array of { agent_id, name }
                allowNull: true,
                defaultValue: null,
                // Example:
                // [
                //   { "agent_id": 5, "name": "John Doe" },
                //   { "agent_id": 8, "name": "Aashish Parmar" }
                // ]
            }
        },
        {
            tableName: "TicketMessage",
            timestamps: true,
        }
    );

    return TicketMessage;
};
