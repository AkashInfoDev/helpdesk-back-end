
// src/controllers/phase4/kbArticleController.js

const { KBArticle, KBCategory, KBArticleHistory, User } = require("../../models");
const { Op } = require("sequelize");

// ------------------------------------------------------------
// Utility: Generate Unique Slug
// ------------------------------------------------------------
function generateSlug(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "");
}

// ------------------------------------------------------------
// ADMIN: Create Article (with image upload)
// ------------------------------------------------------------
exports.createArticle = async (req, res) => {
    try {
        const {
            category_id,
            title,
            summary,
            content_html,
            content_delta,
            visibility,
            status,
        } = req.body;

        // Uploaded file image URL
        const image_url = req.file ? `/uploads/kb/${req.file.filename}` : null;

        // Validate category
        const category = await KBCategory.findByPk(category_id);
        if (!category) {
            return res.status(400).json({ message: "Invalid category ID" });
        }

        // Slug create + uniqueness check
        let slug = generateSlug(title);
        const exists = await KBArticle.findOne({ where: { slug } });

        if (exists) {
            slug = slug + "-" + Date.now();
        }

        const article = await KBArticle.create({
            category_id,
            title,
            slug,
            summary,
            content_html,
            content_delta,
            visibility: visibility || "public",
            status: status || "draft",
            image_url, // <--- NEW
            created_by: req.user.id,
        });

        return res.status(201).json({
            message: "Article created successfully",
            data: article,
        });
    } catch (err) {
        console.error("Create Article Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ------------------------------------------------------------
// ADMIN: Update Article + Create History Version (with image upload)
// ------------------------------------------------------------
exports.updateArticle = async (req, res) => {
    try {
        const { id } = req.params;

        const article = await KBArticle.findByPk(id);
        if (!article) return res.status(404).json({ message: "Article not found" });

        const {
            title,
            summary,
            content_html,
            content_delta,
            visibility,
            status,
            category_id,
            change_note,
        } = req.body;

        // If image uploaded → use new one. If not → keep old.
        const image_url = req.file
            ? `/uploads/kb/${req.file.filename}`
            : article.image_url;

        // -------------------------------
        // STEP 1: Save Old Version in History
        // -------------------------------
        const lastVersion = await KBArticleHistory.findOne({
            where: { article_id: id },
            order: [["version", "DESC"]],
        });

        const newVersion = lastVersion ? lastVersion.version + 1 : 1;

        await KBArticleHistory.create({
            article_id: id,
            version: newVersion,
            title: article.title,
            summary: article.summary,
            content_html: article.content_html,
            content_delta: article.content_delta,
            visibility: article.visibility,
            status: article.status,
            changed_by: req.user.id,
            change_note: change_note || null,
        });

        // -------------------------------
        // STEP 2: Update Article
        // -------------------------------
        let slug = article.slug;

        if (title && title !== article.title) {
            slug = generateSlug(title);

            const exists = await KBArticle.findOne({
                where: { slug, id: { [Op.ne]: id } },
            });

            if (exists) slug = slug + "-" + Date.now();
        }

        await article.update({
            title: title ?? article.title,
            slug,
            summary,
            content_html,
            content_delta,
            visibility,
            status,
            category_id,
            image_url, // <--- NEW
            updated_by: req.user.id,
            published_at: status === "published" ? new Date() : article.published_at,
        });

        return res.json({
            message: "Article updated successfully",
            data: article,
        });
    } catch (err) {
        console.error("Update Article Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ------------------------------------------------------------
// ADMIN: Delete Article
// ------------------------------------------------------------
exports.deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;

        const article = await KBArticle.findByPk(id);
        if (!article) return res.status(404).json({ message: "Article not found" });

        await article.destroy();

        return res.json({ message: "Article deleted successfully" });
    } catch (err) {
        console.error("Delete Article Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ------------------------------------------------------------
// PUBLIC / INTERNAL: Get Article by ID
// ------------------------------------------------------------
exports.getArticleById = async (req, res) => {
    try {
        const { id } = req.params;

        const userRole = req.user?.role_name || "customer";

        const article = await KBArticle.findByPk(id, {
            include: [{ model: KBCategory, as: "category" }],
        });

        if (!article) return res.status(404).json({ message: "Article not found" });

        // Visibility rules
        if (article.visibility === "internal" && !["admin", "agent"].includes(userRole)) {
            return res.status(403).json({ message: "This article is internal only" });
        }

        if (article.status !== "published" && userRole === "customer") {
            return res.status(403).json({ message: "This article is not published" });
        }

        // Increment view count
        article.view_count += 1;
        await article.save();

        return res.json({ data: article });
    } catch (err) {
        console.error("Get Article Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ------------------------------------------------------------
// SEARCH + FILTER
// ------------------------------------------------------------
exports.searchArticles = async (req, res) => {
    try {
        const { search, categoryId, visibility, status } = req.query;
        const userRole = req.user?.role_name || "customer";

        let where = {};

        if (userRole === "customer") {
            where.visibility = "public";
            where.status = "published";
        }

        if (userRole === "agent") {
            if (visibility) where.visibility = visibility;
            where.status = "published";
        }

        if (userRole === "admin") {
            if (visibility) where.visibility = visibility;
            if (status) where.status = status;
        }

        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { summary: { [Op.like]: `%${search}%` } },
            ];
        }

        if (categoryId) where.category_id = categoryId;

        const articles = await KBArticle.findAll({
            where,
            include: [{ model: KBCategory, as: "category" }],
            order: [["created_at", "DESC"]],
        });

        return res.json({ data: articles });
    } catch (err) {
        console.error("Search Articles Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ------------------------------------------------------------
// FEEDBACK
// ------------------------------------------------------------
exports.submitFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { helpful } = req.body;

        const article = await KBArticle.findByPk(id);
        if (!article) return res.status(404).json({ message: "Article not found" });

        if (helpful) article.helpful_count++;
        else article.not_helpful_count++;

        await article.save();

        return res.json({ message: "Feedback recorded successfully" });
    } catch (err) {
        console.error("Feedback Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ------------------------------------------------------------
// Get Article History
// ------------------------------------------------------------
exports.getHistory = async (req, res) => {
    try {
        const { id } = req.params;

        const history = await KBArticleHistory.findAll({
            where: { article_id: id },
            order: [["version", "DESC"]],
        });

        return res.json({ data: history });
    } catch (err) {
        console.error("Get History Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ------------------------------------------------------------
// ADMIN: Get ALL Articles
// ------------------------------------------------------------
exports.getAllArticlesForAdmin = async (req, res) => {
    try {
        const articles = await KBArticle.findAll({
            include: [{ model: KBCategory, as: "category" }],
            order: [["created_at", "DESC"]],
        });

        return res.json({
            message: "All articles fetched successfully",
            data: articles,
        });
    } catch (err) {
        console.error("Get All Articles (Admin) Error:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ==============================
// GET PUBLIC ARTICLES (NO LOGIN)
// ==============================
exports.getPublicArticles = async (req, res) => {
    try {
        const articles = await KBArticle.findAll({
            where: {
                visibility: "public",
                status: "published"
            },
            order: [["created_at", "DESC"]],
            include: [
                {
                    model: KBCategory,
                    as: "category",
                    attributes: ["id", "name", "slug"]
                }
            ]
        });

        res.json(articles);
    } catch (error) {
        console.error("Get Public Articles Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// =====================================
// GET PUBLIC ARTICLE BY SLUG (NO LOGIN)
// =====================================
exports.getPublicArticleBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const article = await KBArticle.findOne({
            where: {
                slug,
                visibility: "public",
                status: "published"
            },
            include: [
                {
                    model: KBCategory,
                    as: "category",
                    attributes: ["id", "name", "slug"]
                }
            ]
        });

        if (!article) {
            return res.status(404).json({ message: "Article not found or not public" });
        }

        res.json(article);
    } catch (error) {
        console.error("Get Public Article By Slug Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
