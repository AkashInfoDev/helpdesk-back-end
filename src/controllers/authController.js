// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// const { User, Role, Otp, AdminUser } = require("../models");
// const { sendOtpEmail } = require("../utils/emailService");

// // ------------------------------------------------------
// // Generate Token
// // ------------------------------------------------------
// function generateToken(payload) {
//     return jwt.sign(payload, process.env.JWT_SECRET, {
//         expiresIn: process.env.JWT_EXPIRES_IN || "1d",
//     });
// }

// // ------------------------------------------------------
// // STEP 1: SEND OTP FOR REGISTRATION
// // ------------------------------------------------------
// exports.sendOtp = async (req, res) => {
//     try {
//         const { name, email, password, role } = req.body;

//         if (!name || !email || !password || !role) {
//             return res.status(400).json({ message: "All fields are required" });
//         }

//         if (!["customer", "agent"].includes(role)) {
//             return res.status(400).json({ message: "Invalid role" });
//         }

//         // Check if email already registered
//         const existing = await User.findOne({ where: { email } });
//         if (existing) {
//             return res.status(400).json({ message: "Email already registered" });
//         }

//         // Generate OTP
//         const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
//         const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

//         // Delete old OTP entries
//         await Otp.destroy({ where: { email } });

//         // Store OTP
//         await Otp.create({
//             email,
//             otp: otpCode,
//             role,
//             expires_at: expiresAt,
//         });

//         // Send email
//         await sendOtpEmail(email, otpCode);

//         return res.json({ message: "OTP sent successfully", email });
//     } catch (error) {
//         console.error("OTP Send Error:", error);
//         return res.status(500).json({ message: "Server Error" });
//     }
// };

// // ------------------------------------------------------
// // STEP 2: VERIFY OTP & CREATE USER
// // ------------------------------------------------------
// exports.verifyOtp = async (req, res) => {
//     try {
//         const { name, email, password, role, otp } = req.body;

//         if (!email || !otp || !password || !name || !role) {
//             return res.status(400).json({ message: "All fields are required" });
//         }

//         const otpEntry = await Otp.findOne({ where: { email, otp } });

//         if (!otpEntry) {
//             return res.status(400).json({ message: "Invalid OTP" });
//         }

//         if (otpEntry.is_verified) {
//             return res.status(400).json({ message: "OTP already used" });
//         }

//         if (new Date() > otpEntry.expires_at) {
//             return res.status(400).json({ message: "OTP expired" });
//         }

//         // Mark verified
//         otpEntry.is_verified = true;
//         await otpEntry.save();

//         // Get role ID
//         const roleData = await Role.findOne({ where: { name: role } });

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create user
//         const user = await User.create({
//             name,
//             email,
//             password: hashedPassword,
//             role_id: roleData.id,
//         });

//         return res.json({
//             message: "Account created successfully",
//             user: {
//                 id: user.id,
//                 email: user.email,
//                 role,
//             },
//         });
//     } catch (error) {
//         console.error("Verify OTP Error:", error);
//         return res.status(500).json({ message: "Server Error" });
//     }
// };

// // ------------------------------------------------------
// // LOGIN (ADMIN + CUSTOMER + AGENT)
// // ------------------------------------------------------
// exports.login = async (req, res) => {
//     try {
//         const { email, password, role } = req.body;

//         if (!email || !password || !role) {
//             return res.status(400).json({ message: "All fields are required" });
//         }

//         // ------------------------------------------------------
//         // ADMIN LOGIN
//         // ------------------------------------------------------
//         if (role === "admin") {
//             const admin = await AdminUser.findOne({ where: { email } });

//             if (!admin) {
//                 return res.status(400).json({ message: "Invalid admin credentials" });
//             }

//             const match = await bcrypt.compare(password, admin.password);
//             if (!match) {
//                 return res.status(400).json({ message: "Invalid admin credentials" });
//             }

//             const token = generateToken({
//                 id: admin.id,
//                 email: admin.email,
//                 role: "admin",
//             });

//             return res.json({
//                 message: "Admin login successful",
//                 token,
//                 admin: {
//                     id: admin.id,
//                     name: admin.name,
//                     email: admin.email,
//                     role: "admin",
//                 },
//             });
//         }

//         // ------------------------------------------------------
//         // CUSTOMER / AGENT LOGIN
//         // ------------------------------------------------------
//         const user = await User.findOne({ where: { email } });

//         if (!user) {
//             return res.status(400).json({ message: "Invalid credentials" });
//         }

//         const roleData = await Role.findByPk(user.role_id);

//         if (roleData.name !== role) {
//             return res.status(400).json({ message: "Role mismatch" });
//         }

//         const match = await bcrypt.compare(password, user.password);

//         if (!match) {
//             return res.status(400).json({ message: "Invalid credentials" });
//         }

//         const token = generateToken({
//             id: user.id,
//             email: user.email,
//             role: roleData.name,
//         });

//         return res.json({
//             message: "Login successful",
//             token,
//             user: {
//                 id: user.id,
//                 name: user.name,
//                 email: user.email,
//                 role,
//             },
//         });
//     } catch (error) {
//         console.error("Login Error:", error);
//         return res.status(500).json({ message: "Server Error" });
//     }
// };

// // ------------------------------------------------------
// // PROFILE
// // ------------------------------------------------------
// exports.getProfile = async (req, res) => {
//     try {
//         return res.json(req.user);
//     } catch (error) {
//         console.error("Profile Error:", error);
//         return res.status(500).json({ message: "Server Error" });
//     }
// };

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
exports.getProfile = (req, res) => {
    try {
        return res.json(req.user);
    } catch (error) {
        console.error("Profile Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};
