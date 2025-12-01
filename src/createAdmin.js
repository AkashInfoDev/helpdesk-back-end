require("dotenv").config();
const bcrypt = require("bcryptjs");
const { AdminUser, sequelize } = require("./models");

async function createAdmin() {
    try {
        await sequelize.authenticate();
        console.log("📌 Database connected successfully.");

        // 💥 ADD THIS LINE
        await sequelize.sync();

        const name = "Admin";
        const email = "admin@gmail.com";
        const plainPassword = "123456";

        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const admin = await AdminUser.create({
            name,
            email,
            password: hashedPassword,
        });

        console.log("✅ Admin created successfully:");
        console.log(admin.toJSON());
        process.exit(0);
    } catch (err) {
        console.error("❌ Error creating admin:", err);
        process.exit(1);
    }
}

createAdmin();
