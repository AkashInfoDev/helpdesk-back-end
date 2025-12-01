// src/models/phase4/KBArticleHistory.js

module.exports = (sequelize, DataTypes) => {
    const KBArticleHistory = sequelize.define(
        "KBArticleHistory",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            // Which article this history entry belongs to
            article_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            // Incrementing version number: 1,2,3,4...
            version: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            // Snapshot of old data
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            summary: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            content_html: {
                type: DataTypes.TEXT("long"),
                allowNull: false,
            },

            content_delta: {
                type: DataTypes.JSON,
                allowNull: false,
            },

            visibility: {
                type: DataTypes.ENUM("public", "internal"),
                allowNull: false,
            },

            status: {
                type: DataTypes.ENUM("draft", "published", "archived", "pending_approval"),
                allowNull: false,
            },

            // Who made the edit
            changed_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            // Optional note: “Updated images”, “Fixed typo”, etc.
            change_note: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            changed_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: "KBArticleHistory",
            timestamps: false, // We manually store changed_at
        }
    );

    return KBArticleHistory;
};
