// src/utils/emailService.js

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.ADMIN_EMAIL,           // your email
        pass: process.env.ADMIN_EMAIL_PASSWORD,  // your app password
    },
});

async function sendOtpEmail(to, otp) {
    try {
        const mailOptions = {
            from: `"Support Team" <${process.env.ADMIN_EMAIL}>`,
            to,
            subject: "Your OTP Verification Code",
            html: `
        <h2>Your Verification OTP</h2>
        <p>Your OTP for account verification is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      `,
        };

        await transporter.sendMail(mailOptions);

        return { success: true };
    } catch (error) {
        console.error("❌ Email sending error:", error);
        return { success: false, error };
    }
}

module.exports = { sendOtpEmail };
