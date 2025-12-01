// src/models/phase3/TicketAttachment.js

module.exports = (sequelize, DataTypes) => {
    const TicketAttachment = sequelize.define(
        "TicketAttachment",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            message_id: {
                type: DataTypes.INTEGER,
                allowNull: false, // linked to TicketMessage
            },

            file_url: {
                type: DataTypes.STRING,
                allowNull: false, // /uploads/tickets/file.png OR external URL
            },

            file_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            file_type: {
                type: DataTypes.STRING,
                allowNull: true, // image/png, application/pdf etc.
            },

            file_size: {
                type: DataTypes.INTEGER,
                allowNull: true, // bytes
            },

            storage_type: {
                type: DataTypes.ENUM("local", "external"),
                defaultValue: "local",
            }
        },
        {
            tableName: "TicketAttachment",
            timestamps: true,
        }
    );

    return TicketAttachment;
};
