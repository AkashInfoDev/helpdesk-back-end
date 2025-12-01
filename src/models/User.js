module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      role_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Admin, Agent, Customer (linked to Role table)
      },

      avatar_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("active", "inactive", "blocked"),
        allowNull: false,
        defaultValue: "active",
      },

      // Phase 5: Agent Availability Status
      availability_status: {
        type: DataTypes.ENUM("online", "offline", "busy", "away"),
        allowNull: true,
        defaultValue: "offline",
        comment: "For agents: online, offline, busy, away",
      },

      last_activity_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Last activity timestamp for auto-status management",
      },

      max_concurrent_chats: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 5,
        comment: "Maximum concurrent chat sessions for agents",
      },

      // Phase 5: Agent Skills (for routing)
      skills: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: "Array of skill tags for agent (e.g., ['technical', 'billing', 'sales'])",
      },
    },
    {
      tableName: "User",
      timestamps: true,
    }
  );

  return User;
};
