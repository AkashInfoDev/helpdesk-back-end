// PM2 Ecosystem Configuration
// Usage: pm2 start ecosystem.config.js

module.exports = {
    apps: [{
        name: 'helpdesk-api',
        script: 'server.js',
        instances: 'max', // Use all CPU cores
        exec_mode: 'cluster', // Cluster mode for load balancing
        env: {
            NODE_ENV: 'development',
            PORT: 5000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 5000
        },
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        autorestart: true,
        watch: false, // Set to true for development
        max_memory_restart: '1G',
        min_uptime: '10s',
        max_restarts: 10,
        restart_delay: 4000
    }]
};

