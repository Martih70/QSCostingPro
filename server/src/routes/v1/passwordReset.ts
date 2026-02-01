import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
} from '../../services/passwordResetService.js';
import logger from '../../utils/logger.js';

const router = Router();

// Validation schemas
const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
});

const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * POST /api/v1/password-reset/request
 * Request password reset email
 */
router.post(
  '/request',
  validate(requestResetSchema),
  (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const message = requestPasswordReset(email);

      logger.info(`Password reset requested for: ${email}`);

      res.json({
        success: true,
        message,
      });
    } catch (error: any) {
      logger.error(`Error requesting password reset: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to process password reset request',
      });
    }
  }
);

/**
 * POST /api/v1/password-reset/verify
 * Verify reset token is valid
 */
router.post(
  '/verify',
  validate(verifyTokenSchema),
  (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      const result = verifyResetToken(token);

      res.json({
        success: result.valid,
        username: result.username,
      });
    } catch (error: any) {
      logger.error(`Error verifying reset token: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to verify reset token',
      });
    }
  }
);

/**
 * POST /api/v1/password-reset/reset
 * Reset password with token
 */
router.post(
  '/reset',
  validate(resetPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      const result = await resetPassword(token, newPassword);

      logger.info(`Password reset successful for: ${result.username}`);

      res.json({
        success: true,
        message: 'Password has been reset successfully',
        username: result.username,
      });
    } catch (error: any) {
      logger.error(`Error resetting password: ${error.message}`);

      // Don't reveal specific error details for security
      const message =
        error.message === 'Invalid or expired reset token'
          ? error.message
          : 'Failed to reset password';

      res.status(400).json({
        success: false,
        error: message,
      });
    }
  }
);

export default router;
