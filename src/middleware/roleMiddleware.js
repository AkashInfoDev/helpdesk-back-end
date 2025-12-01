module.exports = function (...allowedRoles) {
    // Support both usages:
    // - roleMiddleware('admin')
    // - roleMiddleware(['admin'])  <-- some routes use this shape
    if (allowedRoles.length === 1 && Array.isArray(allowedRoles[0])) {
        allowedRoles = allowedRoles[0];
    }
    return async (req, res, next) => {
        try {
            // Accept several token shapes: role_name (string), role (id or name), role_id
            let userRole = req.user?.role_name ?? req.user?.role ?? req.user?.role_id;

            if (userRole == null) {
                return res.status(401).json({
                    message: "Unauthorized: Role not found in token",
                });
            }

            // If role is numeric (id), resolve it to the role name using the Role model
            if (typeof userRole === "number" || /^\d+$/.test(String(userRole))) {
                try {
                    const { Role } = require("../models");
                    const roleRecord = await Role.findByPk(Number(userRole));
                    if (roleRecord) userRole = roleRecord.name;
                } catch (err) {
                    console.warn("Role lookup failed, continuing with raw role value", err.message || err);
                }
            }

            // Check if user role is allowed for this route
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    message: "Access Denied: You do not have permission",
                });
            }

            next();
        } catch (error) {
            console.error("Role Middleware Error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };
};

