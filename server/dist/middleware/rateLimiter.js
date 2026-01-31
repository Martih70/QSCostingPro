import rateLimit from 'express-rate-limit';
/**
 * Rate limiter for authentication endpoints
 * Limits login/register attempts to prevent brute force attacks
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts. Please try again later.',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many authentication attempts. Please try again later.',
            retryAfter: req.rateLimit?.resetTime,
        });
    },
    skip: (_req) => {
        // Skip rate limiting in development
        return process.env.NODE_ENV === 'development';
    },
});
/**
 * Rate limiter for API requests
 * General rate limiting for all API endpoints
 */
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (_req) => {
        // Skip rate limiting in development
        return process.env.NODE_ENV === 'development';
    },
});
//# sourceMappingURL=rateLimiter.js.map