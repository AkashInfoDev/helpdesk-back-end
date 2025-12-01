// src/models/phase3/TicketCategory.js

module.exports = (sequelize, DataTypes) => {
    const TicketCategory = sequelize.define(
        "TicketCategory",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true, // e.g. "Technical", "Billing"
            },

            description: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            tableName: "TicketCategory",
            timestamps: true,
        }
    );

    return TicketCategory;
};
