// src/routes/phase4/kbCategoryRoutes.js

const express = require("express");
const router = express.Router();

const kbCategoryController = require("../../controllers/phase4/kbCategoryController");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");

// -----------------------------------------------------------
// PUBLIC: Get active categories (shown in customer KB UI)
// -----------------------------------------------------------
router.get("/active", authMiddleware, kbCategoryController.getActiveCategories);

// -----------------------------------------------------------
// ADMIN: Get ALL categories (active + inactive)
// -----------------------------------------------------------
router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    kbCategoryController.getAllCategories
);

// -----------------------------------------------------------
// ADMIN: Create category
// -----------------------------------------------------------
router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    kbCategoryController.createCategory
);

// -----------------------------------------------------------
// ADMIN: Update category
// -----------------------------------------------------------
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    kbCategoryController.updateCategory
);

// -----------------------------------------------------------
// ADMIN: Delete category
// -----------------------------------------------------------
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    kbCategoryController.deleteCategory
);

module.exports = router;
