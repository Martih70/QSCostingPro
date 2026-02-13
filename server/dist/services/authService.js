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
 * Verify email with token
 */
export function verifyUserEmail(token) {
    try {
        const db = getDatabase();
        const stmt = db.prepare(`
      UPDATE users
      SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL
      WHERE email_verification_token = ?
      AND email_verification_expires > datetime('now')
    `);
        const result = stmt.run(token);
        return (result.changes ?? 0) > 0;
    }
    catch (error) {
        logger.error(`Email verification failed: ${error}`);
        return false;
    }
}
/**
 * Send password reset token
 */
export async function sendPasswordReset(email) {
    try {
        const db = getDatabase();
        const stmt = db.prepare('SELECT id, username FROM users WHERE email = ?');
        const user = stmt.get(email);
        if (!user) {
            // Don't reveal if email exists
            return true;
        }
        // Generate reset token (24-char random string)
        const resetToken = require('crypto').randomBytes(12).toString('hex');
        const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(); // 1 hour
        const updateStmt = db.prepare(`
      UPDATE users
      SET password_reset_token = ?, password_reset_expires = ?
      WHERE id = ?
    `);
        updateStmt.run(resetToken, expiresAt, user.id);
        // Send email
        const { emailService } = await import('./emailService.js');
        await emailService.sendPasswordResetEmail(email, user.username, resetToken);
        logger.info(`Password reset email sent to ${email}`);
        return true;
    }
    catch (error) {
        logger.error(`Password reset request failed: ${error}`);
        throw error;
    }
}
/**
 * Reset password with token
 */
export async function resetPassword(token, newPassword) {
    try {
        if (newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        const db = getDatabase();
        // Verify token exists and hasn't expired
        const stmt = db.prepare(`
      SELECT id FROM users
      WHERE password_reset_token = ?
      AND password_reset_expires > datetime('now')
    `);
        const user = stmt.get(token);
        if (!user) {
            return false;
        }
        // Hash new password
        const passwordHash = await hashPassword(newPassword);
        // Update password and clear token
        const updateStmt = db.prepare(`
      UPDATE users
      SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL
      WHERE id = ?
    `);
        updateStmt.run(passwordHash, user.id);
        logger.info(`Password reset for user ID ${user.id}`);
        return true;
    }
    catch (error) {
        logger.error(`Password reset failed: ${error}`);
        throw error;
    }
}
/**
 * Get all users (admin only)
 */
export function getAllUsers() {
    try {
        const db = getDatabase();
        const stmt = db.prepare(`
      SELECT id, username, email, email_verified, role, is_active, created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `);
        const users = stmt.all();
        return users;
    }
    catch (error) {
        logger.error(`Failed to fetch users: ${error}`);
        throw error;
    }
}
/**
 * Update user (admin only)
 */
export function updateUser(userId, updates) {
    try {
        const db = getDatabase();
        // Validate role if provided
        const validRoles = ['admin', 'estimator', 'user'];
        if (updates.role && !validRoles.includes(updates.role)) {
            throw new Error('Invalid role');
        }
        // Build update query dynamically
        const setClauses = [];
        const params = [];
        if (updates.role !== undefined) {
            setClauses.push('role = ?');
            params.push(updates.role);
        }
        if (updates.is_active !== undefined) {
            setClauses.push('is_active = ?');
            params.push(updates.is_active ? 1 : 0);
        }
        if (setClauses.length === 0) {
            throw new Error('No updates provided');
        }
        params.push(userId);
        const stmt = db.prepare(`
      UPDATE users
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
        stmt.run(...params);
        // Return updated user
        const getStmt = db.prepare(`
      SELECT id, username, email, email_verified, role, is_active, created_at, last_login
      FROM users WHERE id = ?
    `);
        const user = getStmt.get(userId);
        logger.info(`User ${userId} updated: ${JSON.stringify(updates)}`);
        return user;
    }
    catch (error) {
        logger.error(`Failed to update user: ${error}`);
        throw error;
    }
}
/**
 * Delete user (admin only)
 */
export function deleteUser(userId) {
    try {
        const db = getDatabase();
        const stmt = db.prepare('DELETE FROM users WHERE id = ?');
        stmt.run(userId);
        logger.info(`User ${userId} deleted`);
    }
    catch (error) {
        logger.error(`Failed to delete user: ${error}`);
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