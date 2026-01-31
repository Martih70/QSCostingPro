import type { User, UserPublic, JWTPayload, TokenPair, RegisterRequest, LoginRequest } from '../models/types.js';
/**
 * Hash a password using bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verify a password against its hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Generate JWT access and refresh tokens
 */
export declare function generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair;
/**
 * Verify and decode a JWT token
 */
export declare function verifyToken(token: string): JWTPayload | null;
/**
 * Get user by username
 */
export declare function getUserByUsername(username: string): User | null;
/**
 * Get user by email
 */
export declare function getUserByEmail(email: string): User | null;
/**
 * Get user by ID
 */
export declare function getUserById(id: number): User | null;
/**
 * Convert user to public format (without password hash)
 */
export declare function userToPublic(user: User): UserPublic;
/**
 * Register a new user
 */
export declare function registerUser(req: RegisterRequest): Promise<User>;
/**
 * Login user
 */
export declare function loginUser(req: LoginRequest): Promise<{
    user: User;
    tokens: TokenPair;
}>;
/**
 * Refresh access token
 */
export declare function refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
}>;
/**
 * Logout user (invalidate refresh token)
 */
export declare function logoutUser(userId: number): void;
//# sourceMappingURL=authService.d.ts.map