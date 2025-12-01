const { Sequelize } = require('sequelize');
require('dotenv').config();

// ------------------------------------------------------
// Sequelize Connection Pool
// ------------------------------------------------------
const sequelize = new Sequelize(
    process.env.DB_NAME,      // Database name
    process.env.DB_USER,      // Username
    process.env.DB_PASSWORD,  // Password
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',

        logging: false, // Silent mode (no SQL spam)

        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },

        define: {
            freezeTableName: true,  // Prevents Sequelize from pluralizing table names
            underscored: true       // Converts camelCase → snake_case in DB columns
        }
    }
);

module.exports = sequelize;
