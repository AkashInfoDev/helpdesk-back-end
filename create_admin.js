require('dotenv').config();
const bcrypt = require('bcryptjs');
const { AdminUser, sequelize } = require('./src/models');

async function createAdmin() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected successfully\n');

        // Sync database to ensure AdminUser table exists
        console.log('🔄 Syncing database...');
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced\n');

        // Get admin credentials from environment or use defaults
        const email = process.env.ADMIN_EMAIL || 'admin@example.com';
        const password = process.env.ADMIN_PASSWORD || 'Password123!';
        const name = process.env.ADMIN_NAME || 'Admin';

        // Check if admin already exists
        const existing = await AdminUser.findOne({ where: { email } });
        if (existing) {
            console.log('⚠️  Admin already exists with email:', email);
            console.log('   If you want to create a new admin, use a different email or delete the existing one.\n');
            console.log('📋 Existing Admin Credentials:');
            console.log('   Email:', email);
            console.log('   Name:', existing.name);
            console.log('   ID:', existing.id);
            process.exit(0);
        }

        // Hash password
        console.log('🔄 Creating admin user...');
        const hashed = await bcrypt.hash(password, 10);

        // Create admin
        const admin = await AdminUser.create({ 
            name, 
            email, 
            password: hashed 
        });

        console.log('\n✅ Admin created successfully!\n');
        console.log('📋 Admin Credentials:');
        console.log('   Name:', name);
        console.log('   Email:', email);
        console.log('   Password:', password);
        console.log('   ID:', admin.id);
        console.log('\n💡 Use these credentials to login via POST /api/auth/login');
        console.log('   Body: { "email": "' + email + '", "password": "' + password + '", "role": "admin" }\n');
        
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Failed to create admin:', err.message || err);
        if (err.stack) {
            console.error('\nStack trace:', err.stack);
        }
        process.exit(1);
    }
}

createAdmin();
