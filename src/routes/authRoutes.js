// src/routes/authRoutes.js

const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// ------------------------------------------------------
// 🔹 Registration Flow (Customer + Agent)
// ------------------------------------------------------
router.post("/register/send-otp", authController.sendOtp);
router.post("/register/verify-otp", authController.verifyOtp);

// ------------------------------------------------------
// 🔹 Login (Admin + Customer + Agent)
// ------------------------------------------------------
router.post("/login", authController.login);

// ------------------------------------------------------
// 🔹 Profile (Protected Route)
// ------------------------------------------------------
router.get("/profile", authMiddleware, authController.getProfile);




// ------------------------------------------------------
// 🔹 Forgot Password Flow
// ------------------------------------------------------
router.post("/forgot-password/send-otp", authController.forgotPasswordSendOtp);
router.post("/forgot-password/verify-otp", authController.forgotPasswordVerifyOtp);
router.post("/forgot-password/reset", authController.resetPassword);


module.exports = router;
