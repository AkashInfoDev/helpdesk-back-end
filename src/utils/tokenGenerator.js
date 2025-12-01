const jwt = require("jsonwebtoken");

module.exports = function generateToken(user) {
    // Try to derive a role name from common shapes on the user object
    const roleName =
        user?.role_name ?? user?.role?.name ?? user?.Role?.name ?? null;

    const payload = {
        id: user.id,
        email: user.email,
        role: user.role_id ?? user.role ?? null,
    };

    if (roleName) payload.role_name = roleName;

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });
};
