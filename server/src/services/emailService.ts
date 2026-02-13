import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Initialize email transporter (using Gmail or your SMTP service)
// For development, uses ethereal email (fake service)
let transporter: any = null;

async function initializeTransporter() {
  if (transporter) return transporter;

  // In production, use your email service (Gmail, SendGrid, etc.)
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASSWORD;

  if (emailUser && emailPass) {
    // Production: Real email service
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  } else {
    // Development: Ethereal Email (fake service for testing)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

export const emailService = {
  async sendVerificationEmail(
    email: string,
    username: string,
    verificationToken: string
  ): Promise<void> {
    try {
      const transport = await initializeTransporter();
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@qscostingpro.com',
        to: email,
        subject: 'Verify your QSCostingPro Email',
        html: `
          <h2>Welcome to QSCostingPro!</h2>
          <p>Hi ${username},</p>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="background-color: #2C5F8D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
          <p>Or paste this link in your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link expires in 24 hours.</p>
          <p>Best regards,<br>QSCostingPro Team</p>
        `,
      };

      const info = await transport.sendMail(mailOptions);
      logger.info(`Verification email sent to ${email}`);

      // Log preview URL for development
      if (!process.env.EMAIL_USER) {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error: any) {
      logger.error(`Failed to send verification email: ${error.message}`);
      throw error;
    }
  },

  async sendPasswordResetEmail(
    email: string,
    username: string,
    resetToken: string
  ): Promise<void> {
    try {
      const transport = await initializeTransporter();
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@qscostingpro.com',
        to: email,
        subject: 'Reset your QSCostingPro Password',
        html: `
          <h2>Password Reset Request</h2>
          <p>Hi ${username},</p>
          <p>We received a request to reset your password. Click the link below to create a new password:</p>
          <a href="${resetUrl}" style="background-color: #2C5F8D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
          <p>Or paste this link in your browser:</p>
          <p>${resetUrl}</p>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, you can ignore this email.</p>
          <p>Best regards,<br>QSCostingPro Team</p>
        `,
      };

      const info = await transport.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${email}`);

      // Log preview URL for development
      if (!process.env.EMAIL_USER) {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error: any) {
      logger.error(`Failed to send password reset email: ${error.message}`);
      throw error;
    }
  },
};
