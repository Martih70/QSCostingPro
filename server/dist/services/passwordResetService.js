import { randomBytes } from 'crypto';
import { getDatabase } from '../database/connection.js';
import { hashPassword } from './authService.js';
import logger from '../utils/logger.js';
const RESET_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_LENGTH = 32; // bytes
/**
 * Request password reset by email
 */
export function requestPasswordReset(email) {
    try {
        const db = getDatabase();
        // Find user by email
        const stmt = db.prepare('SELECT id, username FROM users WHERE email = ?');
        const user = stmt.get(email);
        if (!user) {
            // Don't reveal if email exists - for security
            logger.info(`Password reset requested for non-existent email: ${email}`);
            return 'If an account with that email exists, a reset link has been sent.';
        }
        // Generate reset token
        const resetToken = generateResetToken();
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
        // Store token in database
        const updateStmt = db.prepare(`
      UPDATE users
      SET reset_token = ?, reset_token_expires_at = ?
      WHERE id = ?
    `);
        updateStmt.run(resetToken, expiresAt.toISOString(), user.id);
        logger.info(`Password reset token generated for user: ${user.username}`);
        // In production, send email here
        // For now, we'll return the token for testing
        // TODO: Implement email sending via SMTP/SendGrid/etc
        console.log(`\n📧 Password reset token for ${email}:`);
        console.log(`   Token: ${resetToken}`);
        console.log(`   Expires: ${expiresAt.toISOString()}\n`);
        return 'If an account with that email exists, a reset link has been sent.';
    }
    catch (error) {
        logger.error(`Error requesting password reset: ${error}`);
        throw error;
    }
}
/**
 * Reset password with token
 */
export async function resetPassword(token, newPassword) {
    try {
        const db = getDatabase();
        // Find user by reset token
        const stmt = db.prepare(`
      SELECT id, username, reset_token_expires_at
      FROM users
      WHERE reset_token = ?
    `);
        const user = stmt.get(token);
        if (!user) {
            throw new Error('Invalid or expired reset token');
        }
        // Check if token is expired
        const expiresAt = new Date(user.reset_token_expires_at);
        if (expiresAt < new Date()) {
            throw new Error('Reset token has expired');
        }
        // Hash new password
        const passwordHash = await hashPassword(newPassword);
        // Update password and clear reset token
        const updateStmt = db.prepare(`
      UPDATE users
      SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL
      WHERE id = ?
    `);
        updateStmt.run(passwordHash, user.id);
        logger.info(`Password reset completed for user: ${user.username}`);
        return { username: user.username };
    }
    catch (error) {
        logger.error(`Error resetting password: ${error}`);
        throw error;
    }
}
/**
 * Verify reset token is valid
 */
export function verifyResetToken(token) {
    try {
        const db = getDatabase();
        const stmt = db.prepare(`
      SELECT username, reset_token_expires_at
      FROM users
      WHERE reset_token = ?
    `);
        const user = stmt.get(token);
        if (!user) {
            return { valid: false };
        }
        // Check if token is expired
        const expiresAt = new Date(user.reset_token_expires_at);
        if (expiresAt < new Date()) {
            return { valid: false };
        }
        return { valid: true, username: user.username };
    }
    catch (error) {
        logger.error(`Error verifying reset token: ${error}`);
        return { valid: false };
    }
}
/**
 * Generate a secure random reset token
 */
function generateResetToken() {
    return randomBytes(RESET_TOKEN_LENGTH).toString('hex');
}
//# sourceMappingURL=passwordResetService.js.map