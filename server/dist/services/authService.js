import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/connection.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';
const BCRYPT_ROUNDS = 12;
/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}
/**
 * Verify a password against its hash
 */
export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}
/**
 * Generate JWT access and refresh tokens
 */
export function generateTokens(payload) {
    const secret = config.jwtSecret;
    const accessToken = jwt.sign(payload, secret, { expiresIn: config.jwtAccessTokenExpires });
    const refreshToken = jwt.sign(payload, secret, { expiresIn: config.jwtRefreshTokenExpires });
    return {
        accessToken,
        refreshToken,
        expiresIn: config.jwtAccessTokenExpires,
    };
}
/**
 * Verify and decode a JWT token
 */
export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        return decoded;
    }
    catch (error) {
        logger.debug(`Token verification failed: ${error}`);
        return null;
    }
}
/**
 * Get user by username
 */
export function getUserByUsername(username) {
    try {
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
        const user = stmt.get(username);
        return user || null;
    }
    catch (error) {
        logger.error(`Error fetching user by username: ${error}`);
        throw error;
    }
}
/**
 * Get user by email
 */
export function getUserByEmail(email) {
    try {
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(email);
        return user || null;
    }
    catch (error) {
        logger.error(`Error fetching user by email: ${error}`);
        throw error;
    }
}
/**
 * Get user by ID
 */
export function getUserById(id) {
    try {
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const user = stmt.get(id);
        return user || null;
    }
    catch (error) {
        logger.error(`Error fetching user by ID: ${error}`);
        throw error;
    }
}
/**
 * Convert user to public format (without password hash)
 */
export function userToPublic(user) {
    const { password_hash, ...publicUser } = user;
    return publicUser;
}
/**
 * Register a new user
 */
export async function registerUser(req) {
    try {
        // Validate input
        if (!req.username || !req.email || !req.password) {
            throw new Error('Username, email, and password are required');
        }
        if (req.password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }
        if (!isValidEmail(req.email)) {
            throw new Error('Invalid email format');
        }
        // Check if user already exists
        const existingByUsername = getUserByUsername(req.username);
        if (existingByUsername) {
            throw new Error('Username already exists');
        }
        const existingByEmail = getUserByEmail(req.email);
        if (existingByEmail) {
            throw new Error('Email already exists');
        }
        // Hash password
        const passwordHash = await hashPassword(req.password);
        // Insert user with estimator role
        const db = getDatabase();
        const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, ?)
    `);
        const result = stmt.run(req.username, req.email, passwordHash, 'estimator', 1);
        // Fetch and return created user
        const user = getUserById(result.lastInsertRowid);
        if (!user) {
            throw new Error('Failed to create user');
        }
        logger.info(`User registered: ${user.username} (ID: ${user.id})`);
        return user;
    }
    catch (error) {
        logger.error(`Registration failed: ${error}`);
        throw error;
    }
}
/**
 * Login user
 */
export async function loginUser(req) {
    try {
        // Find user
        const user = getUserByUsername(req.username);
        if (!user) {
            throw new Error('Invalid username or password');
        }
        // Check if user is active
        if (!user.is_active) {
            throw new Error('User account is inactive');
        }
        // Verify password
        const passwordValid = await verifyPassword(req.password, user.password_hash);
        if (!passwordValid) {
            throw new Error('Invalid username or password');
        }
        // Generate tokens
        const tokens = generateTokens({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            is_witness: user.is_witness ? true : false,
        });
        // Store refresh token hash in database
        const refreshTokenHash = await hashPassword(tokens.refreshToken);
        const db = getDatabase();
        const storeStmt = db.prepare(`
      INSERT INTO user_refresh_tokens (user_id, token_hash, expires_at)
      VALUES (?, ?, datetime('now', '+7 days'))
    `);
        storeStmt.run(user.id, refreshTokenHash);
        logger.info(`User logged in: ${user.username}`);
        return { user, tokens };
    }
    catch (error) {
        logger.error(`Login failed: ${error}`);
        throw error;
    }
}
/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken) {
    try {
        // Verify refresh token
        const payload = verifyToken(refreshToken);
        if (!payload) {
            throw new Error('Invalid refresh token');
        }
        // Check if refresh token exists and is valid
        const user = getUserById(payload.userId);
        if (!user || !user.is_active) {
            throw new Error('User not found or inactive');
        }
        // Verify refresh token hash in database
        const db = getDatabase();
        const stmt = db.prepare(`
      SELECT * FROM user_refresh_tokens
      WHERE user_id = ? AND expires_at > datetime('now')
      ORDER BY created_at DESC LIMIT 1
    `);
        const storedToken = stmt.get(user.id);
        if (!storedToken) {
            throw new Error('Refresh token not found or expired');
        }
        const tokenHashValid = await verifyPassword(refreshToken, storedToken.token_hash);
        if (!tokenHashValid) {
            throw new Error('Refresh token hash mismatch');
        }
        // Generate new tokens
        const newTokens = generateTokens({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            is_witness: user.is_witness ? true : false,
        });
        // Store new refresh token hash
        const newTokenHash = await hashPassword(newTokens.refreshToken);
        const insertStmt = db.prepare(`
      INSERT INTO user_refresh_tokens (user_id, token_hash, expires_at)
      VALUES (?, ?, datetime('now', '+7 days'))
    `);
        insertStmt.run(user.id, newTokenHash);
        logger.info(`Token refreshed for user: ${user.username}`);
        return {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
        };
    }
    catch (error) {
        logger.error(`Token refresh failed: ${error}`);
        throw error;
    }
}
/**
 * Logout user (invalidate refresh token)
 */
export function logoutUser(userId) {
    try {
        const db = getDatabase();
        const stmt = db.prepare('DELETE FROM user_refresh_tokens WHERE user_id = ?');
        stmt.run(userId);
        logger.info(`User logged out: ID ${userId}`);
    }
    catch (error) {
        logger.error(`Logout failed: ${error}`);
        throw error;
    }
}
/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
//# sourceMappingURL=authService.js.map