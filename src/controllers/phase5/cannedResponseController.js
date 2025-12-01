// src/controllers/phase5/cannedResponseController.js

const { CannedResponse, User, Sequelize } = require("../../models");
const { Op } = Sequelize;

/**
 * Extract variables from content (e.g., {{customer_name}})
 */
function extractVariables(content) {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
        if (!variables.includes(match[1])) {
            variables.push(match[1]);
        }
    }

    return variables;
}

/**
 * Replace variables in content with actual values
 */
function replaceVariables(content, variables) {
    let result = content;
    
    if (variables && typeof variables === 'object') {
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            result = result.replace(regex, variables[key] || `{{${key}}}`);
        });
    }

    return result;
}

// ----------------------------------------
// Get All Canned Responses (Agent)
// ----------------------------------------
exports.getAllCannedResponses = async (req, res) => {
    try {
        const { category, search } = req.query;
        const agentId = req.user.id;

        const where = {
            [Op.or]: [
                { is_shared: true }, // Shared responses
                { created_by: agentId } // Agent's own responses
            ]
        };

        if (category) {
            where.category = category;
        }

        if (search) {
            where[Op.and] = [
                {
                    [Op.or]: [
                        { is_shared: true },
                        { created_by: agentId }
                    ]
                },
                {
                    [Op.or]: [
                        { title: { [Op.like]: `%${search}%` } },
                        { content: { [Op.like]: `%${search}%` } }
                    ]
                }
            ];
            delete where[Op.or];
        }

        const responses = await CannedResponse.findAll({
            where,
            include: [
                {
                    model: User,
                    as: "creator",
                    attributes: ["id", "name", "email"]
                }
            ],
            order: [
                ["category", "ASC"],
                ["title", "ASC"]
            ]
        });

        res.json({
            success: true,
            responses
        });

    } catch (err) {
        console.error("Get Canned Responses Error:", err);
        res.status(500).json({ message: "Failed to fetch canned responses" });
    }
};

// ----------------------------------------
// Get Single Canned Response
// ----------------------------------------
exports.getCannedResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const agentId = req.user.id;

        const response = await CannedResponse.findByPk(id, {
            include: [
                {
                    model: User,
                    as: "creator",
                    attributes: ["id", "name", "email"]
                }
            ]
        });

        if (!response) {
            return res.status(404).json({ message: "Canned response not found" });
        }

        // Check access (shared or creator)
        if (!response.is_shared && response.created_by !== agentId) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json({
            success: true,
            response
        });

    } catch (err) {
        console.error("Get Canned Response Error:", err);
        res.status(500).json({ message: "Failed to fetch canned response" });
    }
};

// ----------------------------------------
// Create Canned Response
// ----------------------------------------
exports.createCannedResponse = async (req, res) => {
    try {
        const { title, content, category, shortcut_key, is_shared } = req.body;
        const agentId = req.user.id;

        if (!title || !content) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

        // Check if shortcut_key already exists
        if (shortcut_key) {
            const existing = await CannedResponse.findOne({
                where: { shortcut_key }
            });
            if (existing) {
                return res.status(400).json({
                    message: "Shortcut key already exists"
                });
            }
        }

        // Extract variables from content
        const variables = extractVariables(content);

        const response = await CannedResponse.create({
            title,
            content,
            category: category || null,
            shortcut_key: shortcut_key || null,
            is_shared: is_shared || false,
            created_by: agentId,
            variables: variables.length > 0 ? variables : null
        });

        const fullResponse = await CannedResponse.findByPk(response.id, {
            include: [
                {
                    model: User,
                    as: "creator",
                    attributes: ["id", "name", "email"]
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: "Canned response created",
            response: fullResponse
        });

    } catch (err) {
        console.error("Create Canned Response Error:", err);
        res.status(500).json({ message: "Failed to create canned response" });
    }
};

// ----------------------------------------
// Update Canned Response
// ----------------------------------------
exports.updateCannedResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, shortcut_key, is_shared } = req.body;
        const agentId = req.user.id;

        const response = await CannedResponse.findByPk(id);

        if (!response) {
            return res.status(404).json({ message: "Canned response not found" });
        }

        // Check access (only creator can update)
        if (response.created_by !== agentId) {
            return res.status(403).json({
                message: "Only the creator can update this response"
            });
        }

        // Check shortcut_key uniqueness if changed
        if (shortcut_key && shortcut_key !== response.shortcut_key) {
            const existing = await CannedResponse.findOne({
                where: { shortcut_key }
            });
            if (existing) {
                return res.status(400).json({
                    message: "Shortcut key already exists"
                });
            }
        }

        // Extract variables if content changed
        let variables = response.variables;
        if (content && content !== response.content) {
            variables = extractVariables(content);
        }

        await response.update({
            title: title || response.title,
            content: content || response.content,
            category: category !== undefined ? category : response.category,
            shortcut_key: shortcut_key !== undefined ? shortcut_key : response.shortcut_key,
            is_shared: is_shared !== undefined ? is_shared : response.is_shared,
            variables: variables
        });

        const updatedResponse = await CannedResponse.findByPk(id, {
            include: [
                {
                    model: User,
                    as: "creator",
                    attributes: ["id", "name", "email"]
                }
            ]
        });

        res.json({
            success: true,
            message: "Canned response updated",
            response: updatedResponse
        });

    } catch (err) {
        console.error("Update Canned Response Error:", err);
        res.status(500).json({ message: "Failed to update canned response" });
    }
};

// ----------------------------------------
// Delete Canned Response
// ----------------------------------------
exports.deleteCannedResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const agentId = req.user.id;

        const response = await CannedResponse.findByPk(id);

        if (!response) {
            return res.status(404).json({ message: "Canned response not found" });
        }

        // Check access (only creator can delete)
        if (response.created_by !== agentId) {
            return res.status(403).json({
                message: "Only the creator can delete this response"
            });
        }

        await response.destroy();

        res.json({
            success: true,
            message: "Canned response deleted"
        });

    } catch (err) {
        console.error("Delete Canned Response Error:", err);
        res.status(500).json({ message: "Failed to delete canned response" });
    }
};

// ----------------------------------------
// Use Canned Response (with variable substitution)
// ----------------------------------------
exports.useCannedResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const { variables } = req.body;
        const agentId = req.user.id;

        const response = await CannedResponse.findByPk(id);

        if (!response) {
            return res.status(404).json({ message: "Canned response not found" });
        }

        // Check access
        if (!response.is_shared && response.created_by !== agentId) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Replace variables in content
        const processedContent = replaceVariables(response.content, variables);

        // Increment usage count
        await response.increment('usage_count');

        res.json({
            success: true,
            content: processedContent,
            original_content: response.content,
            variables_used: variables || {}
        });

    } catch (err) {
        console.error("Use Canned Response Error:", err);
        res.status(500).json({ message: "Failed to use canned response" });
    }
};

// ----------------------------------------
// Get Categories
// ----------------------------------------
exports.getCategories = async (req, res) => {
    try {
        const agentId = req.user.id;

        const responses = await CannedResponse.findAll({
            where: {
                [Op.or]: [
                    { is_shared: true },
                    { created_by: agentId }
                ]
            },
            attributes: ['category'],
            group: ['category']
        });

        const categories = responses
            .map(r => r.category)
            .filter(c => c !== null && c !== undefined)
            .sort();

        res.json({
            success: true,
            categories
        });

    } catch (err) {
        console.error("Get Categories Error:", err);
        res.status(500).json({ message: "Failed to get categories" });
    }
};

// ----------------------------------------
// Get by Shortcut Key
// ----------------------------------------
exports.getByShortcut = async (req, res) => {
    try {
        const { shortcut } = req.params;
        const agentId = req.user.id;

        const response = await CannedResponse.findOne({
            where: { shortcut_key: shortcut },
            include: [
                {
                    model: User,
                    as: "creator",
                    attributes: ["id", "name", "email"]
                }
            ]
        });

        if (!response) {
            return res.status(404).json({ message: "Canned response not found" });
        }

        // Check access
        if (!response.is_shared && response.created_by !== agentId) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json({
            success: true,
            response
        });

    } catch (err) {
        console.error("Get By Shortcut Error:", err);
        res.status(500).json({ message: "Failed to fetch canned response" });
    }
};

// Export replaceVariables for use in Socket.IO
exports.replaceVariables = replaceVariables;

