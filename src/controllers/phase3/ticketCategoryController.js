// src/controllers/phase3/ticketCategoryController.js

const { TicketCategory } = require("../../models");

// ------------------------------------------------------
// CREATE CATEGORY (ADMIN ONLY)
// ------------------------------------------------------
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const exists = await TicketCategory.findOne({ where: { name } });
        if (exists) {
            return res.status(400).json({ message: "Category already exists" });
        }

        const category = await TicketCategory.create({
            name,
            description,
        });

        return res
            .status(201)
            .json({ message: "Category created successfully", category });
    } catch (error) {
        console.error("Create Category Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// ------------------------------------------------------
// UPDATE CATEGORY (ADMIN ONLY)
// ------------------------------------------------------
exports.updateCategory = async (req, res) => {
    try {
        const { category_id } = req.params;
        const { name, description, is_active } = req.body;

        const category = await TicketCategory.findByPk(category_id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        category.name = name || category.name;
        category.description = description || category.description;
        category.is_active = is_active ?? category.is_active;

        await category.save();

        return res.json({
            message: "Category updated successfully",
            category,
        });
    } catch (error) {
        console.error("Update Category Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// ------------------------------------------------------
// DELETE CATEGORY (ADMIN ONLY)
// ------------------------------------------------------
exports.deleteCategory = async (req, res) => {
    try {
        const { category_id } = req.params;

        const category = await TicketCategory.findByPk(category_id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await category.destroy();

        return res.json({
            message: "Category deleted successfully",
        });
    } catch (error) {
        console.error("Delete Category Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

// ------------------------------------------------------
// GET ALL CATEGORIES (ALL USERS)
// ------------------------------------------------------
exports.getCategories = async (req, res) => {
    try {
        const categories = await TicketCategory.findAll({
            order: [["name", "ASC"]],
        });

        return res.json(categories);
    } catch (error) {
        console.error("Get Categories Error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};
