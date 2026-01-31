/**
 * Rate limiter for authentication endpoints
 * Limits login/register attempts to prevent brute force attacks
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiter for API requests
 * General rate limiting for all API endpoints
 */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map