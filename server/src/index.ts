import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config/index.js';
import { initializeDatabase } from './database/connection.js';
import { runMigrations } from './database/migrations.js';
import { runSeeds } from './database/seeds.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/v1/auth.js';
import clientsRoutes from './routes/v1/clients.js';
import contractorsRoutes from './routes/v1/contractors.js';
import costCategoriesRoutes from './routes/v1/costCategories.js';
import costSubElementsRoutes from './routes/v1/costSubElements.js';
import costItemsRoutes from './routes/v1/costItems.js';
import unitsRoutes from './routes/v1/units.js';
import projectsRoutes from './routes/v1/projects.js';
import projectEstimatesRoutes from './routes/v1/projectEstimates.js';
import estimateTemplatesRoutes from './routes/v1/estimateTemplates.js';
import bcisRoutes from './routes/v1/bcis.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();

// CORS Configuration
const corsOrigin = config.isDevelopment
  ? /^http:\/\/localhost(:\d+)?$/ // Allow any localhost port in development
  : config.frontendUrl;

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.http(`${req.method} ${req.path}`);
  next();
});

// Apply rate limiter to API routes
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API version endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clients', clientsRoutes);
app.use('/api/v1/contractors', contractorsRoutes);
app.use('/api/v1/cost-categories', costCategoriesRoutes);
app.use('/api/v1/cost-sub-elements', costSubElementsRoutes);
app.use('/api/v1/cost-items', costItemsRoutes);
app.use('/api/v1/units', unitsRoutes);
app.use('/api/v1/projects', projectsRoutes);
app.use('/api/v1/projects', projectEstimatesRoutes);
app.use('/api/v1/estimate-templates', estimateTemplatesRoutes);
app.use('/api/v1/bcis', bcisRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Error: ${err.message}`);
  logger.error(err.stack);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    ...(config.isDevelopment && { stack: err.stack }),
  });
});

// Initialize database and start server
async function start() {
  try {
    logger.info('Starting KHConstruct server...');

    // Initialize database
    const db = initializeDatabase();
    logger.info('Database initialized');

    // Run migrations
    runMigrations(db);
    logger.info('Database migrations completed');

    // Seed initial data
    await runSeeds(db);
    logger.info('Database seeding completed');

    // Start server
    const port = config.port;
    app.listen(port, () => {
      logger.info(`✓ Server running on http://localhost:${port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Frontend URL: ${config.frontendUrl}`);
      logger.info('Press Ctrl+C to stop');
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

start();

export default app;
