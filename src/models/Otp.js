// src/models/Otp.js

module.exports = (sequelize, DataTypes) => {
    const Otp = sequelize.define(
        "Otp",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },

            email: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            otp: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            role: {
                type: DataTypes.ENUM("customer", "agent"),
                allowNull: false,
            },

            is_verified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },

            expires_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        },
        {
            tableName: "Otp",
            timestamps: true,
        }
    );

    return Otp;
};
