// Check if admin exists and verify credentials
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { AdminUser, sequelize } = require('./src/models');

async function checkAdmin() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        const email = 'admin@gmail.com';
        const password = '123456';

        console.log('🔍 Checking for admin with email:', email);
        const admin = await AdminUser.findOne({ where: { email } });

        if (!admin) {
            console.log('❌ Admin not found in database!');
            console.log('\n💡 Run this command to create admin:');
            console.log('   node src/createAdmin.js');
            console.log('   OR');
            console.log('   npm run create-admin\n');
            process.exit(1);
        }

        console.log('✅ Admin found!');
        console.log('\n📋 Admin Details:');
        console.log('   ID:', admin.id);
        console.log('   Name:', admin.name);
        console.log('   Email:', admin.email);
        console.log('   Status:', admin.status);

        // Test password
        console.log('\n🔐 Testing password...');
        const match = await bcrypt.compare(password, admin.password);
        
        if (match) {
            console.log('✅ Password is correct!');
            console.log('\n✅ Admin credentials are valid!');
            console.log('\n📝 Use these credentials to login:');
            console.log('   Email:', email);
            console.log('   Password:', password);
            console.log('   Role: admin');
        } else {
            console.log('❌ Password does not match!');
            console.log('\n💡 The password in database is different from "123456"');
            console.log('   You may need to recreate the admin or reset the password.\n');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message || err);
        process.exit(1);
    }
}

checkAdmin();

