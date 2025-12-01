# How to Create Admin User

## 🚀 Quick Method (Recommended)

### Option 1: Using npm script
```bash
npm run create-admin
```

### Option 2: Using node directly
```bash
node create_admin.js
```

---

## 📋 What This Does

The script will:
1. ✅ Connect to your database
2. ✅ Sync database tables (create AdminUser table if needed)
3. ✅ Check if admin already exists
4. ✅ Create a new admin user with default or custom credentials
5. ✅ Display the admin credentials

---

## ⚙️ Configuration

### Method 1: Use Default Credentials

Just run the script without any configuration:
```bash
npm run create-admin
```

**Default Admin Credentials:**
- **Email:** `admin@example.com`
- **Password:** `Password123!`
- **Name:** `Admin`

---

### Method 2: Use Environment Variables

Create or update your `.env` file:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourSecurePassword123!
ADMIN_NAME=Admin User
```

Then run:
```bash
npm run create-admin
```

---

## 📝 Example Output

```
🔄 Connecting to database...
✅ Database connected successfully

🔄 Syncing database...
✅ Database synced

🔄 Creating admin user...

✅ Admin created successfully!

📋 Admin Credentials:
   Name: Admin
   Email: admin@example.com
   Password: Password123!
   ID: 1

💡 Use these credentials to login via POST /api/auth/login
   Body: { "email": "admin@example.com", "password": "Password123!", "role": "admin" }
```

---

## 🔐 Login After Creation

After creating the admin, use these credentials to login:

**POST** `/api/auth/login`

**Body:**
```json
{
    "email": "admin@example.com",
    "password": "Password123!",
    "role": "admin"
}
```

**Response:**
```json
{
    "message": "Admin login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
        "id": 1,
        "name": "Admin",
        "email": "admin@example.com",
        "role": "admin"
    }
}
```

---

## ⚠️ Important Notes

1. **Admin Already Exists:** If you run the script and admin already exists, it will show a warning and display the existing admin info. It won't create a duplicate.

2. **Multiple Admins:** To create multiple admins, you need to:
   - Use different email addresses
   - Or manually delete the existing admin from database
   - Or modify the script to allow multiple admins

3. **Password Security:** 
   - Use strong passwords in production
   - Don't commit `.env` file to version control
   - Change default password after first login

4. **Database Connection:** Make sure your `.env` file has correct database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=your_database_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   ```

---

## 🐛 Troubleshooting

### Error: "Cannot find module './src/models'"
**Solution:** Make sure you're running the command from the project root directory.

### Error: "Database connection failed"
**Solution:** 
- Check your `.env` file has correct database credentials
- Ensure MySQL server is running
- Verify database exists

### Error: "AdminUser table doesn't exist"
**Solution:** The script will automatically create the table. If it fails, run:
```bash
npm run migrate
```

### Error: "Admin already exists"
**Solution:** This is not an error. The admin already exists. Use the displayed credentials to login, or delete the existing admin from database if you want to recreate it.

---

## 🔄 Create Multiple Admins

If you want to create multiple admin users, you can:

1. **Modify the script temporarily** to use different emails
2. **Or manually insert** into database:
   ```sql
   INSERT INTO AdminUser (name, email, password) 
   VALUES ('Admin 2', 'admin2@example.com', '$2a$10$hashedpassword...');
   ```

---

## ✅ Verification

After creating admin, verify it works:

1. **Test Login:**
   ```bash
   # Use Postman or curl
   POST http://localhost:5000/api/auth/login
   Body: {
       "email": "admin@example.com",
       "password": "Password123!",
       "role": "admin"
   }
   ```

2. **Check Database:**
   ```sql
   SELECT * FROM AdminUser;
   ```

---

**That's it! Your admin is ready to use! 🎉**

