
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { User, Role, Otp, AdminUser } = require("../models");
const { sendOtpEmail } = require("../utils/emailService");

// ------------------------------------------------------
// Generate Token
// ------------------------------------------------------
function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
}

// ------------------------------------------------------
// STEP 1: SEND OTP FOR REGISTRATION
// ------------------------------------------------------
exports.sendOtp = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!["customer", "agent"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.destroy({ where: { email } });

        await Otp.create({
            email,
            otp: otpCode,
            role,
            expires_at: expiresAt,
        });

        await sendOtpEmail(email, otpCode);

        return res.json({ message: "OTP sent successfully", email });
    } catch (error) {
        console.error("OTP Send Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// ------------------------------------------------------
// STEP 2: VERIFY OTP & CREATE USER
// ------------------------------------------------------
exports.verifyOtp = async (req, res) => {
    try {
        const { name, email, password, role, otp } = req.body;

        if (!email || !otp || !password || !name || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const otpEntry = await Otp.findOne({ where: { email, otp } });

        if (!otpEntry) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (otpEntry.is_verified) {
            return res.status(400).json({ message: "OTP already used" });
        }

        if (new Date() > otpEntry.expires_at) {
            return res.status(400).json({ message: "OTP expired" });
        }

        otpEntry.is_verified = true;
        await otpEntry.save();

        const roleData = await Role.findOne({ where: { name: role } });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role_id: roleData.id,
        });

        return res.json({
            message: "Account created successfully",
            user: {
                id: user.id,
                email: user.email,
                role,
            },
        });
    } catch (error) {
        console.error("Verify OTP Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// ------------------------------------------------------
// LOGIN (ADMIN + CUSTOMER + AGENT)
// ------------------------------------------------------
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // ------------------------------------------------------
        // ADMIN LOGIN
        // ------------------------------------------------------
        if (role === "admin") {
            const admin = await AdminUser.findOne({ where: { email } });

            if (!admin) {
                return res.status(400).json({ message: "Invalid admin credentials" });
            }

            const match = await bcrypt.compare(password, admin.password);
            if (!match) {
                return res.status(400).json({ message: "Invalid admin credentials" });
            }

            const token = generateToken({
                id: admin.id,
                email: admin.email,
                role_name: "admin",
                role: "admin",
            });

            return res.json({
                message: "Admin login successful",
                token,
                admin: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    role: "admin",
                    role_name: "admin",
                },
            });
        }

        // ------------------------------------------------------
        // CUSTOMER / AGENT LOGIN
        // ------------------------------------------------------
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const roleData = await Role.findByPk(user.role_id);

        if (roleData.name !== role) {
            return res.status(400).json({ message: "Role mismatch" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: roleData.id,
            role_name: roleData.name,
        });

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: roleData.name,
                role_name: roleData.name,
                role_id: user.role_id,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// ------------------------------------------------------
// PROFILE
// ------------------------------------------------------
// exports.getProfile = (req, res) => {
//     try {
//         return res.json(req.user);
//     } catch (error) {
//         console.error("Profile Error:", error);
//         return res.status(500).json({ message: "Server Error" });
//     }
// };

// const { User } = require("../models");

// ------------------------------------------------------
// GET PROFILE (Customer / Agent - Single API)
// ------------------------------------------------------
exports.getProfile = async (req, res) => {
    try {
        const user = req.user; // injected by authMiddleware

        // 🧠 Base profile (common for all)
        const baseProfile = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role_name,
            status: user.status,
            avatar_url: user.avatar_url,
            createdAt: user.createdAt,
        };

        // 👤 CUSTOMER PROFILE
        if (user.role_name === "customer") {
            return res.json({
                type: "customer",
                profile: baseProfile,
            });
        }

        // 🎧 AGENT PROFILE
        if (user.role_name === "agent") {
            return res.json({
                type: "agent",
                profile: {
                    ...baseProfile,
                    availability_status: user.availability_status,
                    last_activity_at: user.last_activity_at,
                    max_concurrent_chats: user.max_concurrent_chats,
                    skills: user.skills,
                },
            });
        }

        // 🛑 Fallback (safety net)
        return res.status(403).json({
            message: "Invalid user role",
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};



exports.forgotPasswordSendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Clear old OTPs
        await Otp.destroy({ where: { email } });

        await Otp.create({
            email,
            otp: otpCode,
            role: "password_reset",
            expires_at: expiresAt,
        });

        await sendOtpEmail(email, otpCode);

        return res.json({ message: "OTP sent to email" });
    } catch (error) {
        console.error("Forgot Password OTP Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};


exports.forgotPasswordVerifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP required" });
        }

        const otpEntry = await Otp.findOne({
            where: { email, otp, role: "password_reset" },
        });

        if (!otpEntry) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (otpEntry.is_verified) {
            return res.status(400).json({ message: "OTP already used" });
        }

        if (new Date() > otpEntry.expires_at) {
            return res.status(400).json({ message: "OTP expired" });
        }

        otpEntry.is_verified = true;
        await otpEntry.save();

        return res.json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error("Verify Forgot OTP Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};


exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ message: "Email and new password required" });
        }

        const otpEntry = await Otp.findOne({
            where: {
                email,
                role: "password_reset",
                is_verified: true,
            },
        });

        if (!otpEntry) {
            return res.status(400).json({ message: "OTP verification required" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.update(
            { password: hashedPassword },
            { where: { email } }
        );

        // Cleanup OTP after success
        await Otp.destroy({ where: { email, role: "password_reset" } });

        return res.json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};


// ------------------------------------------------------
// UPDATE CUSTOMER PROFILE
// ------------------------------------------------------
exports.updateCustomerProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        // 🛑 Role Guard
        if (req.user.role_name !== "customer") {
            return res.status(403).json({
                message: "Access denied. Customer only API.",
            });
        }

        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                message: "Name must be at least 2 characters long",
            });
        }

        await User.update(
            { name: name.trim() },
            { where: { id: userId } }
        );

        const updatedUser = await User.findByPk(userId, {
            attributes: ["id", "name", "email", "status"],
        });

        return res.json({
            message: "Customer profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Customer Profile Update Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// ------------------------------------------------------
// UPDATE AGENT PROFILE
// ------------------------------------------------------
exports.updateAgentProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name,
            availability_status,
            max_concurrent_chats,
            skills,
        } = req.body;

        // 🛑 Role Guard
        if (req.user.role_name !== "agent") {
            return res.status(403).json({
                message: "Access denied. Agent only API.",
            });
        }

        const updateData = {};

        if (name) updateData.name = name.trim();
        if (availability_status)
            updateData.availability_status = availability_status;
        if (max_concurrent_chats)
            updateData.max_concurrent_chats = max_concurrent_chats;
        if (skills) updateData.skills = skills;

        await User.update(updateData, { where: { id: userId } });

        const updatedAgent = await User.findByPk(userId, {
            attributes: [
                "id",
                "name",
                "email",
                "availability_status",
                "max_concurrent_chats",
                "skills",
                "status",
            ],
        });

        return res.json({
            message: "Agent profile updated successfully",
            user: updatedAgent,
        });
    } catch (error) {
        console.error("Agent Profile Update Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};
