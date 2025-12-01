const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        // Extract token
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user data to request
        req.user = decoded;

        // Dev-only: log decoded token to help debug role/fields (guarded)
        if (process.env.NODE_ENV !== "production") {
            try {
                console.debug("[authMiddleware] decoded token:", JSON.stringify(decoded));
            } catch (e) {
                // ignore logging errors
            }
        }

        next(); // Continue to controller
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};
