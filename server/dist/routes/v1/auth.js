import { Router } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, refreshAccessToken, logoutUser, userToPublic, } from '../../services/authService.js';
import { verifyAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import logger from '../../utils/logger.js';
const router = Router();
// Validation schemas
const registerSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(8).max(100),
});
const loginSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});
const refreshSchema = z.object({
    refreshToken: z.string().min(1),
});
/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, async (req, res) => {
    try {
        // Validate input
        const validatedData = registerSchema.parse(req.body);
        // Register user
        const user = await registerUser(validatedData);
        const publicUser = userToPublic(user);
        logger.info(`New user registered: ${user.username}`);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: publicUser,
        });
    }
    catch (error) {
        logger.error(`Registration error: ${error.message}`);
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
            return;
        }
        const statusCode = error.message?.includes('already exists') ? 409 : 400;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Registration failed',
        });
    }
});
/**
 * POST /api/v1/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', authLimiter, async (req, res) => {
    try {
        // Validate input
        const validatedData = loginSchema.parse(req.body);
        // Login user
        const { user, tokens } = await loginUser(validatedData);
        const publicUser = userToPublic(user);
        logger.info(`User logged in: ${user.username}`);
        res.json({
            success: true,
            user: publicUser,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
        });
    }
    catch (error) {
        logger.warn(`Login failed: ${error.message}`);
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
            return;
        }
        res.status(401).json({
            success: false,
            error: error.message || 'Login failed',
        });
    }
});
/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
    try {
        // Validate input
        const validatedData = refreshSchema.parse(req.body);
        // Refresh token
        const tokens = await refreshAccessToken(validatedData.refreshToken);
        logger.info('Token refreshed');
        res.json({
            success: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    }
    catch (error) {
        logger.warn(`Token refresh failed: ${error.message}`);
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
            return;
        }
        res.status(401).json({
            success: false,
            error: error.message || 'Token refresh failed',
        });
    }
});
/**
 * POST /api/v1/auth/logout
 * Logout user (invalidate refresh token)
 * Requires authentication
 */
router.post('/logout', verifyAuth, (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
            return;
        }
        logoutUser(req.user.userId);
        logger.info(`User logged out: ${req.user.username}`);
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        logger.error(`Logout error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Logout failed',
        });
    }
});
/**
 * GET /api/v1/auth/me
 * Get current user info
 * Requires authentication
 */
router.get('/me', verifyAuth, (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated',
            });
            return;
        }
        res.json({
            success: true,
            user: {
                id: req.user.userId,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role,
            },
        });
    }
    catch (error) {
        logger.error(`Get user error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to get user info',
        });
    }
});
/**
 * GET /api/v1/auth/users
 * Get all users (admin only)
 * Requires authentication
 */
router.get('/users', verifyAuth, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Admin access required',
            });
            return;
        }
        const { getDatabase } = await import('../../database/connection.js');
        const db = getDatabase();
        const users = db
            .prepare(`SELECT id, username, email, role, is_witness, is_active, created_at FROM users ORDER BY created_at DESC`)
            .all();
        res.json({
            success: true,
            users,
        });
    }
    catch (error) {
        logger.error(`Get users error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to get users',
        });
    }
});
/**
 * PUT /api/v1/auth/users/:id
 * Update user (admin only)
 * Requires authentication
 */
const updateUserSchema = z.object({
    username: z.string().min(3).max(30).optional(),
    email: z.string().email().optional(),
    role: z.enum(['admin', 'estimator', 'viewer']).optional(),
    is_active: z.boolean().optional(),
});
router.put('/users/:id', verifyAuth, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: 'Admin access required',
            });
            return;
        }
        const validatedData = updateUserSchema.parse(req.body);
        const { getDatabase } = await import('../../database/connection.js');
        const db = getDatabase();
        const userId = parseInt(req.params.id, 10);
        // Check if user exists
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }
        // Build update query
        const updates = [];
        const values = [];
        if (validatedData.username !== undefined) {
            updates.push('username = ?');
            values.push(validatedData.username);
        }
        if (validatedData.email !== undefined) {
            updates.push('email = ?');
            values.push(validatedData.email);
        }
        if (validatedData.role !== undefined) {
            updates.push('role = ?');
            values.push(validatedData.role);
        }
        if (validatedData.is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(validatedData.is_active ? 1 : 0);
        }
        if (updates.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No fields to update',
            });
            return;
        }
        values.push(userId);
        const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...values);
        logger.info(`User updated: ${userId}`);
        res.json({
            success: true,
            message: 'User updated successfully',
        });
    }
    catch (error) {
        logger.error(`Update user error: ${error.message}`);
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.errors,
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update user',
        });
    }
});
export default router;
//# sourceMappingURL=auth.js.map