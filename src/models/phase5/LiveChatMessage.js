module.exports = (sequelize, DataTypes) => {
    const LiveChatMessage = sequelize.define("LiveChatMessage", {
        session_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sender_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        sender_role: {
            type: DataTypes.ENUM("customer", "agent", "system"),
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM("text", "file", "kb_article", "system"),
            defaultValue: "text",
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        attachment_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        kb_article_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        is_internal: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        }
    }, {
        tableName: "LiveChatMessage",
        timestamps: true,
    });

    return LiveChatMessage;
};
