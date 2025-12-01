// Fix/Create admin with specific credentials
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { AdminUser, sequelize } = require('./src/models');

async function fixAdmin() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        // Sync database
        console.log('🔄 Syncing database...');
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced\n');

        const email = 'admin@gmail.com';
        const password = '123456';
        const name = 'Admin';

        // Check if admin exists
        let admin = await AdminUser.findOne({ where: { email } });

        if (admin) {
            console.log('⚠️  Admin already exists. Updating password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            await admin.update({ password: hashedPassword });
            console.log('✅ Admin password updated!\n');
        } else {
            console.log('🔄 Creating new admin...');
            const hashedPassword = await bcrypt.hash(password, 10);
            admin = await AdminUser.create({
                name,
                email,
                password: hashedPassword,
            });
            console.log('✅ Admin created!\n');
        }

        console.log('📋 Admin Credentials:');
        console.log('   Name:', admin.name);
        console.log('   Email:', admin.email);
        console.log('   Password:', password);
        console.log('   ID:', admin.id);
        console.log('\n✅ Admin is ready to use!');
        console.log('\n💡 Login with:');
        console.log('   POST /api/auth/login');
        console.log('   Body: {');
        console.log('     "email": "admin@gmail.com",');
        console.log('     "password": "123456",');
        console.log('     "role": "admin"');
        console.log('   }\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message || err);
        if (err.stack) {
            console.error('\nStack:', err.stack);
        }
        process.exit(1);
    }
}

fixAdmin();

