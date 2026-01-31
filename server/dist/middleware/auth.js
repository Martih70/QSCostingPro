import { verifyToken } from '../services/authService.js';
import logger from '../utils/logger.js';
/**
 * JWT verification middleware
 * Extracts and verifies the JWT token from Authorization header
 */
export function verifyAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger.warn(`Missing or invalid Authorization header for ${req.method} ${req.path}`);
            res.status(401).json({
                success: false,
                error: 'Missing or invalid authorization header',
            });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const payload = verifyToken(token);
        if (!payload) {
            logger.warn(`Invalid token for ${req.method} ${req.path}`);
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
            return;
        }
        // Attach user payload to request
        req.user = payload;
        next();
    }
    catch (error) {
        logger.error(`Auth middleware error: ${error}`);
        res.status(500).json({
            success: false,
            error: 'Authentication error',
        });
    }
}
/**
 * Optional auth middleware
 * Verifies JWT if provided, but doesn't require it
 */
export function optionalAuth(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = verifyToken(token);
            if (payload) {
                req.user = payload;
            }
        }
        next();
    }
    catch (error) {
        logger.error(`Optional auth middleware error: ${error}`);
        next(); // Continue even if there's an error
    }
}
//# sourceMappingURL=auth.js.map