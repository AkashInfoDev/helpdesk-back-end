// src/models/AdminUser.js

module.exports = (sequelize, DataTypes) => {
    const AdminUser = sequelize.define(
        "AdminUser",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },

            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            status: {
                type: DataTypes.ENUM("active", "inactive"),
                allowNull: false,
                defaultValue: "active",
            },
        },
        {
            tableName: "AdminUser",
            timestamps: true,
        }
    );

    return AdminUser;
};
