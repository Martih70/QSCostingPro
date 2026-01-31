import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const config = {
    // Server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    // Database
    databasePath: process.env.DATABASE_PATH || path.join(__dirname, '../../database/khconstruct.db'),
    uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../database/uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    // JWT
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production-min-32-chars',
    jwtAccessTokenExpires: process.env.JWT_ACCESS_TOKEN_EXPIRES || '15m',
    jwtRefreshTokenExpires: process.env.JWT_REFRESH_TOKEN_EXPIRES || '7d',
    // CORS
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    // Currency
    defaultCurrency: process.env.DEFAULT_CURRENCY || 'GBP',
    // Inflation API (optional)
    inflationApiKey: process.env.INFLATION_API_KEY || '',
    // Validation
    isProduction: (process.env.NODE_ENV || 'development') === 'production',
    isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
};
// Validate required environment variables
if (!config.jwtSecret || config.jwtSecret === 'your-secret-key-change-in-production-min-32-chars') {
    if (config.isProduction) {
        throw new Error('JWT_SECRET environment variable must be set in production');
    }
    console.warn('⚠️  Using default JWT_SECRET. This is not secure in production!');
}
//# sourceMappingURL=index.js.map