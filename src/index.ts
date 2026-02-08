import 'dotenv/config'; // Load env vars before any other imports
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
// import dotenv from 'dotenv'; // Removed as we use import 'dotenv/config'
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './db/db';
import routes from './routes';
import { generalLimiter } from './middleware/rateLimiter';
import { requestLogger, errorLogger } from './middleware/logging';
import logger from './utils/logger';
import path from 'path';
import User from './models/User';
import Role from './models/Role';

// Load environment variables - Moved to top
// dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || 'development';
// Trust proxy (Render/Heroku)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000', // Development Frontend
    'https://reveda-doctor-form.onrender.com', // Doctor Registration Website
    process.env.FRONTEND_URL, // Production Frontend
    'http://192.168.1.11:8081', // Expo Go (Local)
    'http://192.168.1.11:5000'  // Local API Access
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn(`🚫 Blocked CORS request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Custom logging middleware (before morgan)
app.use(requestLogger);

// Morgan HTTP request logging (Quiet in production)
app.use(morgan(ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/v1', routes);

// Basic Route
app.get('/', (req: Request, res: Response) => {
    logger.info('🏠 ROOT ENDPOINT ACCESSED');
    res.json({
        success: true,
        message: 'ReVeda Backend API is running',
        version: '1.0.0',
        environment: ENV,
        timestamp: new Date().toISOString()
    });
});

// 404 handler - must be after all other routes
app.use((req: Request, res: Response, next: express.NextFunction) => {
    logger.warn(`🔍 404 NOT FOUND: ${req.method} ${req.originalUrl} from ${req.ip}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

// Error logging middleware
app.use(errorLogger);

// Global error handler
app.use((error: any, req: Request, res: Response, next: express.NextFunction) => {
    logger.error(`💥 GLOBAL ERROR: ${error.message}`, {
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: ENV === 'development' ? error.message : undefined
    });
});

// Database Seeding & Migration Logic
const seedRoles = async () => {
    try {
        const roles = ['Patient', 'Doctor', 'Admin', 'Marketing'];
        for (const roleName of roles) {
            const exists = await Role.findOne({ name: roleName });
            if (!exists) {
                await Role.create({
                    name: roleName,
                    slug: roleName.toLowerCase(),
                    description: `Default ${roleName} role`
                });
                logger.info(`✅ Seeded Role: ${roleName}`);
            }
        }
    } catch (error) {
        logger.error('Failed to seed roles', error);
    }
};

const migrateUserRoles = async () => {
    try {
        // Find users with string roles (legacy) using native collection to bypass schema validation
        const usersToMigrate = await User.collection.find({ role: { $in: ['Patient', 'Doctor', 'Admin', 'Marketing'] } }).toArray();

        if (usersToMigrate.length > 0) {
            logger.info(`🔄 Migrating ${usersToMigrate.length} users to dynamic roles...`);

            for (const user of usersToMigrate) {
                const roleDoc = await Role.findOne({ name: user.role });
                if (roleDoc) {
                    // Update directly using updateOne to avoid schema validation issues during migration
                    await User.collection.updateOne(
                        { _id: user._id },
                        { $set: { role: roleDoc._id } }
                    );
                }
            }
            logger.info('✨ Migration completed successfully.');
        }

        // Users are now migrated, safe to run aggregation
        // ... (User stats logging omitted for brevity/performance or can be re-added if needed)

    } catch (error) {
        logger.error('Failed to migrate user roles', error);
    }
};

// Connect to DB and start server
connectDB().then(async () => {
    // Run Migrations
    await seedRoles();
    await migrateUserRoles();

    app.listen(PORT, () => {
        logger.info('🚀 SERVER STARTED');
        logger.info(`📱 Environment: ${ENV}`);
        logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
        logger.info(`🛡️  Security: Helmet Enabled, CORS Restriction: ${ENV === 'production' ? 'Strict' : 'Relaxed'}`);
        logger.info('✅ ReVeda Backend is ready to serve requests');
    });
}).catch((err: any) => {
    logger.error("❌ Failed to connect to DB", err);
    process.exit(1);
});
