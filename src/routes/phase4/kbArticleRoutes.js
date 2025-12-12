// src/routes/phase4/kbArticleRoutes.js

const express = require("express");
const router = express.Router();

const kbArticleController = require("../../controllers/phase4/kbArticleController");

const authMiddleware = require("../../middleware/authMiddleware");
const roleMiddleware = require("../../middleware/roleMiddleware");
const upload = require("../../middleware/kbUpload");

// -------------------------------------------------------------
// SEARCH ARTICLES (multi-role search rules inside controller)
// -------------------------------------------------------------
router.get(
    "/search",
    authMiddleware, // all roles use search: admin, agent, customer
    kbArticleController.searchArticles
);

// -------------------------------------------------------------
// ADMIN: Get ALL articles (no restrictions)
// -------------------------------------------------------------
router.get(
    "/admin/all",
    authMiddleware,
    roleMiddleware("admin"),
    kbArticleController.getAllArticlesForAdmin
);


// -------------------------------------------------------------
// GET ARTICLE BY ID (role-based visibility handled in controller)
// -------------------------------------------------------------
router.get(
    "/:id",
    authMiddleware,
    kbArticleController.getArticleById
);

// -------------------------------------------------------------
// ADMIN: CREATE ARTICLE
// -------------------------------------------------------------
router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    upload.single("image"),
    kbArticleController.createArticle
);

// -------------------------------------------------------------
// ADMIN: UPDATE ARTICLE + versioning
// -------------------------------------------------------------
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    upload.single("image"),
    kbArticleController.updateArticle
);

// -------------------------------------------------------------
// ADMIN: DELETE ARTICLE
// -------------------------------------------------------------
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    kbArticleController.deleteArticle
);

// -------------------------------------------------------------
// ARTICLE FEEDBACK (everyone can rate articles)
// -------------------------------------------------------------
router.post(
    "/:id/feedback",
    authMiddleware,
    kbArticleController.submitFeedback
);

// -------------------------------------------------------------
// ADMIN + AGENT: Get Article version history
// -------------------------------------------------------------
router.get(
    "/:id/history",
    authMiddleware,
    roleMiddleware("admin", "agent"),
    kbArticleController.getHistory
);

router.get("/public/articles", kbArticleController.getPublicArticles);
router.get("/public/articles/:slug", kbArticleController.getPublicArticleBySlug);

module.exports = router;
