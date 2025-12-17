const express = require("express");
const router = express.Router();

const userController = require("../../controllers/phase4/userController");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

// -----------------------------------------------------------
// ADMIN: Get all users
// -----------------------------------------------------------
router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    userController.getAllUsers
);


module.exports = router;
