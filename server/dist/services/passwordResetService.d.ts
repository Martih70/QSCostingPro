export interface ResetTokenRequest {
    email: string;
}
export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}
/**
 * Request password reset by email
 */
export declare function requestPasswordReset(email: string): string;
/**
 * Reset password with token
 */
export declare function resetPassword(token: string, newPassword: string): Promise<{
    username: string;
}>;
/**
 * Verify reset token is valid
 */
export declare function verifyResetToken(token: string): {
    valid: boolean;
    username?: string;
};
//# sourceMappingURL=passwordResetService.d.ts.map