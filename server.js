
require('dotenv').config();

// Validate environment variables first
const { validateEnv } = require('./src/utils/envValidator');
validateEnv();

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require("http");
const { Server } = require("socket.io");
const logger = require('./src/utils/logger');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./src/middleware/rateLimiter');

const app = express();

// --------------------------------------
// CORS Configuration
// --------------------------------------
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// --------------------------------------
// Middlewares
// --------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------------------------------
// Database
// --------------------------------------
const { sequelize } = require('./src/models');
const seedRoles = require('./src/seeders/roleSeeder');

// --------------------------------------
// Routes
// --------------------------------------

// Auth Routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// Phase 3 Routes
const ticketCategoryRoutes = require("./src/routes/phase3/ticketCategoryRoutes");
const ticketRoutes = require("./src/routes/phase3/ticketRoutes");
app.use("/api/ticket-categories", ticketCategoryRoutes);
app.use("/api/tickets", ticketRoutes);

// Phase 4 Routes
const kbCategoryRoutes = require("./src/routes/phase4/kbCategoryRoutes");
const kbArticleRoutes = require("./src/routes/phase4/kbArticleRoutes");
const kbUploadRoutes = require("./src/routes/phase4/kbUploadRoutes");
app.use("/api/kb/categories", kbCategoryRoutes);
app.use("/api/kb/articles", kbArticleRoutes);
app.use("/api/kb/upload", kbUploadRoutes);

// Phase 5 Routes (REST)
const liveChatRoutes = require("./src/routes/phase5/liveChatRoutes");
const agentAvailabilityRoutes = require("./src/routes/phase5/agentAvailabilityRoutes");
const chatUploadRoutes = require("./src/routes/phase5/chatUploadRoutes");
const cannedResponseRoutes = require("./src/routes/phase5/cannedResponseRoutes");
app.use("/api/live-chat", liveChatRoutes);
app.use("/api/agent-availability", agentAvailabilityRoutes);
app.use("/api/chat-upload", chatUploadRoutes);
app.use("/api/canned-responses", cannedResponseRoutes);

// --------------------------------------
// Health Check
// --------------------------------------
app.get('/', (req, res) => {
    res.json({
        message: 'Helpdesk & Ticketing API is running 🚀',
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        await sequelize.authenticate();

        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
});

// --------------------------------------
// START SERVER (HTTP SERVER + SOCKET.IO)
// --------------------------------------
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Database connection
        await sequelize.authenticate();
        logger.info("✅ Database connected");

        // Database sync: Only in development
        if (process.env.NODE_ENV !== "production") {
            // await sequelize.sync({ alter: true });
            await sequelize.sync();

            // logger.info("🔁 Database synced (alter mode)");
            logger.info("🔁 Database synchronized successfully");

        } else {
            // In production, don't auto-sync - use migrations instead
            logger.info("✅ Database ready (migrations should be run separately)");
            logger.warn("⚠️  Make sure to run migrations before starting the server in production!");
        }

        // Seeder (only runs if roles don't exist)
        await seedRoles();

        // Create HTTP Server
        const httpServer = http.createServer(app);

        // Initialize Socket.IO with proper CORS
        const io = new Server(httpServer, {
            cors: {
                origin: function (origin, callback) {
                    // Allow requests with no origin
                    if (!origin) return callback(null, true);

                    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
                        callback(null, true);
                    } else {
                        logger.warn(`Socket.IO CORS blocked origin: ${origin}`);
                        callback(new Error('Not allowed by CORS'));
                    }
                },
                credentials: true,
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling'], // Explicitly set transports
            allowEIO3: true // Allow Engine.IO v3 clients
        });

        // Load Chat Socket Handlers
        const chatSocket = require("./src/socket/chatSocket");
        chatSocket(io);

        // Add error handler middleware (must be last)
        app.use(notFoundHandler);
        app.use(errorHandler);

        // Start server
        httpServer.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`⚡ Socket.IO active and running`);
            logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`📡 Allowed origins: ${allowedOrigins.join(', ')}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger.info('SIGTERM received, shutting down gracefully...');
            httpServer.close(() => {
                logger.info('HTTP server closed');
                sequelize.close().then(() => {
                    logger.info('Database connection closed');
                    process.exit(0);
                });
            });
        });

        process.on('SIGINT', async () => {
            logger.info('SIGINT received, shutting down gracefully...');
            httpServer.close(() => {
                logger.info('HTTP server closed');
                sequelize.close().then(() => {
                    logger.info('Database connection closed');
                    process.exit(0);
                });
            });
        });

    } catch (error) {
        logger.error("❌ Server failed:", error);
        process.exit(1);
    }
}

startServer();
