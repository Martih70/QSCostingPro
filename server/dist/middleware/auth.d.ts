import { Request, Response, NextFunction } from 'express';
import type { JWTPayload } from '../models/types.js';
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
/**
 * JWT verification middleware
 * Extracts and verifies the JWT token from Authorization header
 */
export declare function verifyAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Optional auth middleware
 * Verifies JWT if provided, but doesn't require it
 */
export declare function optionalAuth(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map