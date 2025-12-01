// src/controllers/phase4/kbCategoryController.js

const { KBCategory } = require("../../models");
const { Op } = require("sequelize");

// Helper: generate a URL-friendly slug from text
const generateSlug = (text) => {
    if (!text) return null;
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/(^-|-$)/g, "");
};

// ---------------------------------------------------------
// ADMIN: Create a KB Category
// ---------------------------------------------------------
exports.createCategory = async (req, res) => {
    try {
        const { name, slug, description, sort_order, is_active } = req.body;

        const slugValue = slug || generateSlug(name);

        const exists = await KBCategory.findOne({ where: { [Op.or]: [{ name }, { slug: slugValue }] } });
        if (exists) {
            return res.status(400).json({ message: "Category name or slug already exists" });
        }

        const category = await KBCategory.create({
            name,
            slug: slugValue,
            description,
            sort_order: sort_order ?? 0,
            is_active: is_active ?? true,
        });

        return res.status(201).json({
            message: "Category created successfully",
            data: category,
        });
    } catch (err) {
        console.error("Create Category Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ---------------------------------------------------------
// ALL USERS: Get all active categories (for frontend KB UI)
// ---------------------------------------------------------
exports.getActiveCategories = async (req, res) => {
    try {
        const categories = await KBCategory.findAll({
            where: { is_active: true },
            order: [["sort_order", "ASC"], ["name", "ASC"]],
        });

        return res.json({ data: categories });
    } catch (err) {
        console.error("Get Active Categories Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ---------------------------------------------------------
// ADMIN: Get all categories (active + inactive)
// ---------------------------------------------------------
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await KBCategory.findAll({
            order: [["created_at", "DESC"]],
        });

        return res.json({ data: categories });
    } catch (err) {
        console.error("Get All Categories Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ---------------------------------------------------------
// ADMIN: Update category
// ---------------------------------------------------------
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, sort_order, is_active } = req.body;

        const category = await KBCategory.findByPk(id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Ensure we have a slug (generate from name if missing)
        const slugValue = slug || generateSlug(name);

        // Prevent duplicate slug/name
        const duplicate = await KBCategory.findOne({
            where: {
                id: { [Op.ne]: id },
                [Op.or]: [{ name }, { slug: slugValue }],
            },
        });

        if (duplicate) {
            return res.status(400).json({ message: "Slug or name already exists" });
        }

        await category.update({
            name,
            slug: slugValue,
            description,
            sort_order,
            is_active,
        });

        return res.json({
            message: "Category updated successfully",
            data: category,
        });
    } catch (err) {
        console.error("Update Category Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ---------------------------------------------------------
// ADMIN: Delete category
// ---------------------------------------------------------
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await KBCategory.findByPk(id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await category.destroy();

        return res.json({ message: "Category deleted successfully" });
    } catch (err) {
        console.error("Delete Category Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
