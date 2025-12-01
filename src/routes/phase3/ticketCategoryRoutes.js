// src/routes/phase3/ticketCategoryRoutes.js

const express = require("express");
const router = express.Router();

const categoryController = require("../../controllers/phase3/ticketCategoryController");
const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

// ------------------------------------------------------
// CATEGORY ROUTES
// ------------------------------------------------------

// CREATE CATEGORY (Admin only)
router.post(
    "/",
    authMiddleware,
    roleMiddleware(["admin"]),
    categoryController.createCategory
);

// UPDATE CATEGORY (Admin only)
router.put(
    "/:category_id",
    authMiddleware,
    roleMiddleware(["admin"]),
    categoryController.updateCategory
);

// DELETE CATEGORY (Admin only)
router.delete(
    "/:category_id",
    authMiddleware,
    roleMiddleware(["admin"]),
    categoryController.deleteCategory
);

// GET ALL CATEGORIES (any user)
router.get("/", categoryController.getCategories);

module.exports = router;
