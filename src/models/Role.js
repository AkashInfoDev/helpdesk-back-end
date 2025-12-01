module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define(
        "Role",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true, // admin, agent, customer
            },

            description: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: "Role",
            timestamps: true,
        }
    );

    return Role;
};
