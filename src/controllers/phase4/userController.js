const { User, Role } = require("../../models");

// -----------------------------------------------------------
// ADMIN: Get all users
// -----------------------------------------------------------
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: [
                "id",
                "name",
                "email",
                "avatar_url",
                "status",
                "availability_status",
                "last_activity_at",
                "max_concurrent_chats",
                "skills",
                "created_at",
                "updated_at"
            ],
            include: [
                {
                    model: Role,
                    attributes: ["name"], // admin | agent | customer
                }
            ],
            order: [["created_at", "DESC"]],
        });

        const formatted = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            avatar_url: u.avatar_url,
            role: u.Role?.name || "unknown",
            status: u.status,                         // active, banned, etc
            availability_status: u.availability_status, // online, offline, busy
            last_activity_at: u.last_activity_at,
            max_concurrent_chats: u.max_concurrent_chats,
            skills: u.skills,
            created_at: u.created_at,
            updated_at: u.updated_at,
        }));

        return res.json({ data: formatted });
    } catch (err) {
        console.error("GetAllUsers Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
