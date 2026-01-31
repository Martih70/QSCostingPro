import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
// Ensure database directory exists
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    logger.info(`Created database directory: ${dbDir}`);
}
// Initialize database connection
let db = null;
export function initializeDatabase() {
    try {
        db = new Database(config.databasePath);
        // Enable WAL mode for better concurrency
        db.pragma('journal_mode = WAL');
        // Set synchronous mode to NORMAL for better performance
        db.pragma('synchronous = NORMAL');
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        logger.info(`Database initialized at ${config.databasePath}`);
        return db;
    }
    catch (error) {
        logger.error(`Failed to initialize database: ${error}`);
        throw error;
    }
}
export function getDatabase() {
    if (!db) {
        return initializeDatabase();
    }
    return db;
}
export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        logger.info('Database connection closed');
    }
}
// Handle graceful shutdown
process.on('exit', () => closeDatabase());
process.on('SIGINT', () => {
    closeDatabase();
    process.exit(0);
});
//# sourceMappingURL=connection.js.map