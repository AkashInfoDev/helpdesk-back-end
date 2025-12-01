

const Sequelize = require("sequelize");
const sequelize = require("../config/db");

// --------------------------------------------
// IMPORT MODELS (ALL PHASES)
// --------------------------------------------
const AdminUserModel = require("./AdminUser");
const UserModel = require("./User");
const RoleModel = require("./Role");
const OtpModel = require("./Otp");

// Phase 3
const TicketCategoryModel = require("./phase3/TicketCategory");
const TicketModel = require("./phase3/Ticket");
const TicketMessageModel = require("./phase3/TicketMessage");
const TicketAttachmentModel = require("./phase3/TicketAttachment");

// Phase 4
const KBCategoryModel = require("./phase4/KBCategory");
const KBArticleModel = require("./phase4/KBArticle");
const KBArticleHistoryModel = require("./phase4/KBArticleHistory");

// Phase 5
const LiveChatSessionModel = require("./phase5/LiveChatSession");
const LiveChatMessageModel = require("./phase5/LiveChatMessage");
const CannedResponseModel = require("./phase5/CannedResponse");

// --------------------------------------------
// INITIALIZE MODELS
// --------------------------------------------
const AdminUser = AdminUserModel(sequelize, Sequelize.DataTypes);
const User = UserModel(sequelize, Sequelize.DataTypes);
const Role = RoleModel(sequelize, Sequelize.DataTypes);
const Otp = OtpModel(sequelize, Sequelize.DataTypes);

// Phase 3
const TicketCategory = TicketCategoryModel(sequelize, Sequelize.DataTypes);
const Ticket = TicketModel(sequelize, Sequelize.DataTypes);
const TicketMessage = TicketMessageModel(sequelize, Sequelize.DataTypes);
const TicketAttachment = TicketAttachmentModel(sequelize, Sequelize.DataTypes);

// Phase 4
const KBCategory = KBCategoryModel(sequelize, Sequelize.DataTypes);
const KBArticle = KBArticleModel(sequelize, Sequelize.DataTypes);
const KBArticleHistory = KBArticleHistoryModel(sequelize, Sequelize.DataTypes);

// Phase 5
const LiveChatSession = LiveChatSessionModel(sequelize, Sequelize.DataTypes);
const LiveChatMessage = LiveChatMessageModel(sequelize, Sequelize.DataTypes);
const CannedResponse = CannedResponseModel(sequelize, Sequelize.DataTypes);

// --------------------------------------------
// RELATIONSHIPS (NO FOREIGN KEY CONSTRAINTS)
// --------------------------------------------

// ------------------
// PHASE 2 RELATIONS
// ------------------
Role.hasMany(User, { foreignKey: "role_id", constraints: false });
User.belongsTo(Role, { foreignKey: "role_id", constraints: false });

// ------------------
// PHASE 3 RELATIONS
// ------------------

// Category → Tickets
TicketCategory.hasMany(Ticket, {
    foreignKey: "category_id",
    as: "tickets",
    constraints: false,
});
Ticket.belongsTo(TicketCategory, {
    foreignKey: "category_id",
    as: "category",
    constraints: false,
});

// Customer → Tickets
User.hasMany(Ticket, {
    foreignKey: "customer_id",
    as: "customerTickets",
    constraints: false,
});
Ticket.belongsTo(User, {
    foreignKey: "customer_id",
    as: "customer",
    constraints: false,
});

// Agent → Tickets
User.hasMany(Ticket, {
    foreignKey: "agent_id",
    as: "assignedTickets",
    constraints: false,
});
Ticket.belongsTo(User, {
    foreignKey: "agent_id",
    as: "agent",
    constraints: false,
});

// Ticket → Messages
Ticket.hasMany(TicketMessage, {
    foreignKey: "ticket_id",
    as: "messages",
    constraints: false,
});
TicketMessage.belongsTo(Ticket, {
    foreignKey: "ticket_id",
    constraints: false,
});

// Message → Attachments
TicketMessage.hasMany(TicketAttachment, {
    foreignKey: "message_id",
    as: "attachments",
    constraints: false,
});
TicketAttachment.belongsTo(TicketMessage, {
    foreignKey: "message_id",
    constraints: false,
});

// ------------------
// PHASE 4 RELATIONS
// ------------------

// KB Category → KB Articles
KBCategory.hasMany(KBArticle, {
    foreignKey: "category_id",
    as: "articles",
    constraints: false,
});
KBArticle.belongsTo(KBCategory, {
    foreignKey: "category_id",
    as: "category",
    constraints: false,
});

// KB Article → History
KBArticle.hasMany(KBArticleHistory, {
    foreignKey: "article_id",
    as: "history",
    constraints: false,
});
KBArticleHistory.belongsTo(KBArticle, {
    foreignKey: "article_id",
    constraints: false,
});

// ------------------
// PHASE 5 RELATIONS
// ------------------

// Customer → LiveChat Sessions
User.hasMany(LiveChatSession, {
    foreignKey: "customer_id",
    as: "liveChatSessions",
    constraints: false,
});
LiveChatSession.belongsTo(User, {
    foreignKey: "customer_id",
    as: "customer",
    constraints: false,
});

// Agent → LiveChat Sessions
User.hasMany(LiveChatSession, {
    foreignKey: "agent_id",
    as: "assignedLiveChats",
    constraints: false,
});
LiveChatSession.belongsTo(User, {
    foreignKey: "agent_id",
    as: "agent",
    constraints: false,
});

// Session → Messages
LiveChatSession.hasMany(LiveChatMessage, {
    foreignKey: "session_id",
    as: "messages",
    constraints: false,
});
LiveChatMessage.belongsTo(LiveChatSession, {
    foreignKey: "session_id",
    constraints: false,
});

// KB Article → LiveChat Messages (optional)
KBArticle.hasMany(LiveChatMessage, {
    foreignKey: "kb_article_id",
    as: "chat_messages",
    constraints: false,
});
LiveChatMessage.belongsTo(KBArticle, {
    foreignKey: "kb_article_id",
    as: "kb_article",
    constraints: false,
});

// Agent → Canned Responses
User.hasMany(CannedResponse, {
    foreignKey: "created_by",
    as: "cannedResponses",
    constraints: false,
});
CannedResponse.belongsTo(User, {
    foreignKey: "created_by",
    as: "creator",
    constraints: false,
});

// --------------------------------------------
// EXPORT ALL MODELS
// --------------------------------------------
module.exports = {
    sequelize,
    Sequelize,

    AdminUser,
    User,
    Role,
    Otp,

    // Phase 3
    TicketCategory,
    Ticket,
    TicketMessage,
    TicketAttachment,

    // Phase 4
    KBCategory,
    KBArticle,
    KBArticleHistory,

    // Phase 5
    LiveChatSession,
    LiveChatMessage,
    CannedResponse,
};
