// src/models/phase4/KBArticle.js

module.exports = (sequelize, DataTypes) => {
    const KBArticle = sequelize.define(
        "KBArticle",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            // Link to KBCategory
            category_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            // Title of article
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            // SEO / user-friendly URL slug
            slug: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },

            // One-line summary for search cards
            summary: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            // Quill HTML output - displayed directly on UI
            content_html: {
                type: DataTypes.TEXT("long"),
                allowNull: false,
            },

            // Raw Quill Delta JSON - used when editing article
            content_delta: {
                type: DataTypes.JSON,
                allowNull: false,
            },

            // Visibility rules (public = customers + internal = agents/admins only)
            visibility: {
                type: DataTypes.ENUM("public", "internal"),
                allowNull: false,
                defaultValue: "public",
            },

            // Publishing state
            status: {
                type: DataTypes.ENUM("draft", "published", "archived", "pending_approval"),
                allowNull: false,
                defaultValue: "draft",
            },

            // Audit tracking
            created_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            updated_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },

            approved_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },

            // Optional publishing timestamp
            published_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            // Basic analytics
            view_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            helpful_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            not_helpful_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            tableName: "KBArticle",
            timestamps: true,
        }
    );

    return KBArticle;
};
