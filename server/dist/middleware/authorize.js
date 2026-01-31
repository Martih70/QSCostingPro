import logger from '../utils/logger.js';
/**
 * Role-based authorization middleware factory
 * Returns middleware that checks if user has one of the specified roles
 */
export function authorize(...allowedRoles) {
    return (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                logger.warn(`Unauthorized access attempt to ${req.method} ${req.path}`);
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                });
                return;
            }
            // Check if user has required role
            if (!allowedRoles.includes(req.user.role)) {
                logger.warn(`Forbidden: User ${req.user.username} (${req.user.role}) tried to access ${req.method} ${req.path}`);
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    requiredRoles: allowedRoles,
                    userRole: req.user.role,
                });
                return;
            }
            next();
        }
        catch (error) {
            logger.error(`Authorization middleware error: ${error}`);
            res.status(500).json({
                success: false,
                error: 'Authorization error',
            });
        }
    };
}
/**
 * Check if user owns a resource
 * Useful for checking if user can edit their own data
 */
export function isOwner(resourceUserId) {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                });
                return;
            }
            // Admin can access anything, others only their own resources
            if (req.user.role !== 'admin' && req.user.userId !== resourceUserId) {
                logger.warn(`User ${req.user.username} attempted to access resource owned by user ${resourceUserId}`);
                res.status(403).json({
                    success: false,
                    error: 'You do not have permission to access this resource',
                });
                return;
            }
            next();
        }
        catch (error) {
            logger.error(`Owner check middleware error: ${error}`);
            res.status(500).json({
                success: false,
                error: 'Authorization error',
            });
        }
    };
}
//# sourceMappingURL=authorize.js.map