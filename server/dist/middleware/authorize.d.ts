import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../models/types.js';
/**
 * Role-based authorization middleware factory
 * Returns middleware that checks if user has one of the specified roles
 */
export declare function authorize(...allowedRoles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Check if user owns a resource
 * Useful for checking if user can edit their own data
 */
export declare function isOwner(resourceUserId: number): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authorize.d.ts.map