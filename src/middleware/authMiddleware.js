// const jwt = require("jsonwebtoken");

// module.exports = (req, res, next) => {
//     try {
//         // Extract token
//         const token = req.headers.authorization?.split(" ")[1];

//         if (!token) {
//             return res.status(401).json({ message: "Unauthorized: No token provided" });
//         }

//         // Verify token
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         // Attach user data to request
//         req.user = decoded;




//         // Dev-only: log decoded token to help debug role/fields (guarded)
//         if (process.env.NODE_ENV !== "production") {
//             try {
//                 console.debug("[authMiddleware] decoded token:", JSON.stringify(decoded));
//             } catch (e) {
//                 // ignore logging errors
//             }
//         }

//         next(); // Continue to controller
//     } catch (error) {
//         console.error("Auth Middleware Error:", error);
//         return res.status(401).json({ message: "Unauthorized: Invalid token" });
//     }
// };



const jwt = require("jsonwebtoken");
const { User, Role } = require("../models");

module.exports = async (req, res, next) => {
    try {
        // -----------------------------------
        // 1. Extract token
        // -----------------------------------
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null;

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized: No token provided",
            });
        }

        // -----------------------------------
        // 2. Verify token
        // -----------------------------------
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // decoded should contain at least userId
        if (!decoded.id) {
            return res.status(401).json({
                message: "Unauthorized: Invalid token payload",
            });
        }

        // -----------------------------------
        // 3. Fetch fresh user from DB
        // -----------------------------------
        const user = await User.findByPk(decoded.id, {
            include: [
                {
                    model: Role,
                    attributes: ["id", "name"],
                },
            ],
        });

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized: User not found",
            });
        }

        if (user.status === "blocked") {
            return res.status(403).json({
                message: "Account is blocked",
            });
        }

        // -----------------------------------
        // 4. Attach normalized user object
        // -----------------------------------
        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role_id: user.role_id,
            role_name: user.Role?.name, // 👈 CRITICAL
            status: user.status,
            avatar_url: user.avatar_url,

            // Agent-specific (safe to attach)
            availability_status: user.availability_status,
            last_activity_at: user.last_activity_at,
            max_concurrent_chats: user.max_concurrent_chats,
            skills: user.skills,

            createdAt: user.createdAt,
        };

        // -----------------------------------
        // 5. Dev-only logging
        // -----------------------------------
        if (process.env.NODE_ENV !== "production") {
            console.debug(
                "[authMiddleware] authenticated user:",
                JSON.stringify({
                    id: req.user.id,
                    role: req.user.role_name,
                })
            );
        }

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(401).json({
            message: "Unauthorized: Invalid or expired token",
        });
    }
};
