# Production Deployment Guide

## 📋 Prerequisites

- Node.js 16+ installed
- MySQL 8.0+ installed and running
- Domain name (for production)
- SSL certificate (for HTTPS)
- Server with at least 2GB RAM

---

## 🚀 Step-by-Step Deployment

### **Step 1: Install Dependencies**

```bash
npm install
```

This will install all required packages including:
- express-rate-limit
- express-validator
- winston (for logging)

---

### **Step 2: Set Up Environment Variables**

1. Create `.env` file in project root:
```bash
cp ENV_EXAMPLE.md .env
# Then edit .env with your values
```

2. **Required variables for production:**
```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=helpdesk_prod
DB_USER=helpdesk_user
DB_PASSWORD=strong_password_here
JWT_SECRET=very_strong_random_secret_at_least_32_characters
JWT_EXPIRES_IN=1d
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

3. **Generate strong JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### **Step 3: Database Setup**

1. **Create database:**
```sql
CREATE DATABASE helpdesk_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'helpdesk_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON helpdesk_prod.* TO 'helpdesk_user'@'localhost';
FLUSH PRIVILEGES;
```

2. **Run migrations:**
```bash
npm run migrate
```

3. **Create admin user:**
```bash
npm run create-admin
```

---

### **Step 4: Install PM2 (Process Manager)**

```bash
npm install -g pm2
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
    apps: [{
        name: 'helpdesk-api',
        script: 'server.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production',
            PORT: 5000
        },
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        autorestart: true,
        max_memory_restart: '1G'
    }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### **Step 5: Set Up Nginx Reverse Proxy**

Install Nginx:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

Create Nginx config `/etc/nginx/sites-available/helpdesk`:
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO endpoint
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        access_log off;
    }

    # Uploads (if serving files through Nginx)
    location /uploads/ {
        alias /path/to/your/project/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/helpdesk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### **Step 6: Set Up SSL with Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

### **Step 7: Set Up Log Rotation**

Create `/etc/logrotate.d/helpdesk`:
```
/path/to/your/project/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 node node
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

### **Step 8: Firewall Configuration**

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🔧 Configuration Checklist

- [ ] Environment variables set
- [ ] Database created and migrations run
- [ ] Admin user created
- [ ] PM2 installed and configured
- [ ] Nginx configured with SSL
- [ ] Firewall configured
- [ ] Log rotation set up
- [ ] Backups configured

---

## 📊 Monitoring

### **Check PM2 Status:**
```bash
pm2 status
pm2 logs helpdesk-api
pm2 monit
```

### **Check Nginx Status:**
```bash
sudo systemctl status nginx
sudo nginx -t
```

### **Check Application Logs:**
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

### **Health Check:**
```bash
curl https://yourdomain.com/health
```

---

## 🔄 Updates & Maintenance

### **Update Application:**
```bash
git pull
npm install
npm run migrate  # If there are new migrations
pm2 restart helpdesk-api
```

### **Database Backup:**
```bash
mysqldump -u helpdesk_user -p helpdesk_prod > backup_$(date +%Y%m%d).sql
```

### **Restore Database:**
```bash
mysql -u helpdesk_user -p helpdesk_prod < backup_20240101.sql
```

---

## 🐛 Troubleshooting

### **Socket.IO Not Connecting:**
- Check Nginx WebSocket configuration
- Verify CORS settings in `.env`
- Check firewall rules
- Review Socket.IO logs

### **Database Connection Issues:**
- Verify database credentials in `.env`
- Check MySQL is running: `sudo systemctl status mysql`
- Test connection: `mysql -u helpdesk_user -p`

### **Rate Limiting Too Strict:**
- Adjust `RATE_LIMIT_MAX_REQUESTS` in `.env`
- Check logs for rate limit errors

---

## 🔒 Security Best Practices

1. **Keep dependencies updated:**
```bash
npm audit
npm audit fix
```

2. **Regular backups:**
   - Database: Daily
   - Uploads: Daily
   - Logs: Weekly

3. **Monitor logs:**
   - Check error logs daily
   - Set up alerts for critical errors

4. **Update system:**
```bash
sudo apt update && sudo apt upgrade
```

---

## 📝 Post-Deployment

1. Test all API endpoints
2. Test Socket.IO connection
3. Test file uploads
4. Monitor logs for errors
5. Set up monitoring alerts
6. Configure backups

---

**Your application is now production-ready! 🚀**

