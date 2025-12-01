// src/models/phase4/KBCategory.js

module.exports = (sequelize, DataTypes) => {
    const KBCategory = sequelize.define(
        "KBCategory",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },

            // Visible name → shown in UI
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true, // e.g. "Getting Started", "Billing", "Technical Issues"
            },

            // URL / identifier-friendly version → for future SEO / front-end routing
            slug: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true, // e.g. "getting-started", "billing"
            },

            // Short description for category listing
            description: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            // Controls order in UI (lower number = higher priority)
            sort_order: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            // Soft enable/disable category
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            tableName: "KBCategory", // matches your freezeTableName setup
            timestamps: true,        // created_at / updated_at (because of underscored: true)
        }
    );

    return KBCategory;
};
