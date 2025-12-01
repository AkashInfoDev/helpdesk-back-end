const { Role } = require("../models");

async function seedRoles() {
    try {
        const defaultRoles = [
            { name: "admin", description: "Full system access" },
            { name: "agent", description: "Support agent with ticket permissions" },
            { name: "customer", description: "End-user with limited access" },
        ];

        for (const role of defaultRoles) {
            await Role.findOrCreate({
                where: { name: role.name },
                defaults: role,
            });
        }

        console.log("✅ Roles seeded successfully");
    } catch (err) {
        console.error("❌ Error seeding roles:", err);
    }
}

module.exports = seedRoles;
