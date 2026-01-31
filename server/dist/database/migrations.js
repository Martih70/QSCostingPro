import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function getMigrationFiles() {
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
        fs.mkdirSync(migrationsDir, { recursive: true });
        return [];
    }
    return fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
}
function loadMigration(filename) {
    const filepath = path.join(__dirname, 'migrations', filename);
    return fs.readFileSync(filepath, 'utf8');
}
export function runMigrations(db) {
    try {
        // Create migrations table if it doesn't exist
        db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        const migrations = getMigrationFiles();
        const executedMigrations = db.prepare('SELECT name FROM migrations').all();
        const executedNames = new Set(executedMigrations.map(m => m.name));
        for (const migrationFile of migrations) {
            if (!executedNames.has(migrationFile)) {
                logger.info(`Running migration: ${migrationFile}`);
                const migrationSql = loadMigration(migrationFile);
                try {
                    db.exec(migrationSql);
                    db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationFile);
                    logger.info(`✓ Migration completed: ${migrationFile}`);
                }
                catch (error) {
                    logger.error(`✗ Migration failed: ${migrationFile} - ${error}`);
                    throw new Error(`Migration ${migrationFile} failed: ${error}`);
                }
            }
        }
        logger.info('All migrations completed successfully');
    }
    catch (error) {
        logger.error(`Migration process failed: ${error}`);
        throw error;
    }
}
export function rollbackMigration(db, migrationName) {
    try {
        logger.info(`Rolling back migration: ${migrationName}`);
        const migration = loadMigration(migrationName);
        // Migrations file should have -- DOWN: section for rollback
        const parts = migration.split('-- DOWN:');
        if (parts.length > 1) {
            const downSql = parts[1].trim();
            db.exec(downSql);
            db.prepare('DELETE FROM migrations WHERE name = ?').run(migrationName);
            logger.info(`✓ Rollback completed: ${migrationName}`);
        }
        else {
            logger.warn(`No rollback script found for migration: ${migrationName}`);
        }
    }
    catch (error) {
        logger.error(`Rollback failed: ${error}`);
        throw error;
    }
}
//# sourceMappingURL=migrations.js.map