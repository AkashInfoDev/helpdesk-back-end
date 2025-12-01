// src/models/phase5/CannedResponse.js

module.exports = (sequelize, DataTypes) => {
  const CannedResponse = sequelize.define(
    "CannedResponse",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Short title/name for the canned response",
      },

      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment:
          "The actual response content (supports variables like {{customer_name}})",
      },

      category: {
        type: DataTypes.STRING,
        allowNull: true,
        comment:
          "Category for organization (e.g., 'greeting', 'closing', 'technical')",
      },

      shortcut_key: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        comment: "Shortcut key for quick access (e.g., '/greeting')",
      },

      is_shared: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "If true, all agents can use. If false, only creator can use.",
      },

      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Agent ID who created this response",
      },

      variables: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment:
          "Array of variable names used in content (e.g., ['customer_name', 'ticket_id'])",
      },

      usage_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Track how many times this response has been used",
      },
    },
    {
      tableName: "CannedResponse",
      timestamps: true,
    }
  );

  return CannedResponse;
};
