// Run all Phase 5 migrations
// This script will add missing columns and create missing tables

require('dotenv').config();
const { sequelize, User, LiveChatSession, CannedResponse } = require('../src/models');

async function runMigrations() {
    try {
        console.log('🔄 Starting Phase 5 migrations...\n');

        // Authenticate database connection
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Sync User model (will add missing columns)
        console.log('📝 Syncing User table...');
        await User.sync({ alter: true });
        console.log('✅ User table synced\n');

        // Sync LiveChatSession model (will add missing columns)
        console.log('📝 Syncing LiveChatSession table...');
        await LiveChatSession.sync({ alter: true });
        console.log('✅ LiveChatSession table synced\n');

        // Sync CannedResponse model (will create table if not exists)
        console.log('📝 Syncing CannedResponse table...');
        await CannedResponse.sync({ alter: true });
        console.log('✅ CannedResponse table synced\n');

        console.log('✅ All migrations completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runMigrations();

