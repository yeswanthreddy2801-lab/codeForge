import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { signAccessToken, signRefreshToken } from '../../shared/utils/jwt.util';
import { z } from 'zod';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from './auth.schema';
import { redisClient } from '../../config/redis';

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, 
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export class AuthService {
  static async register(data: z.infer<typeof RegisterSchema>) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      throw { statusCode: 409, message: 'Email or username already exists' };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const verifyToken = uuidv4();

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        passwordHash,
        verifyToken,
      },
    });

    // Send verification email
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
    await transporter.sendMail({
      from: `"CodeForge" <${env.SMTP_USER}>`,
      to: user.email,
      subject: 'Verify your CodeForge account',
      html: `
        <h1>Welcome to CodeForge!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      `,
    });

    const jwtPayload = { id: user.id, username: user.username, role: user.role };
    const accessToken = signAccessToken(jwtPayload);
    const refreshToken = signRefreshToken(jwtPayload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { user: { id: user.id, username: user.username, email: user.email, isVerified: user.isVerified }, accessToken, refreshToken };
  }

  static async login(data: z.infer<typeof LoginSchema>) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    if (!user.isVerified) {
      throw { statusCode: 403, message: 'Please verify your email first' };
    }

    const jwtPayload = { id: user.id, username: user.username, role: user.role };
    const accessToken = signAccessToken(jwtPayload);
    const refreshToken = signRefreshToken(jwtPayload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl }, accessToken, refreshToken };
  }

  static async logout(refreshToken: string, userId?: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
    // Clear user specific cache if any
    if (userId) {
      await redisClient.del(`user:stats:${userId}`);
    }
  }

  static async refresh(refreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw { statusCode: 401, message: 'Invalid or expired refresh token' };
    }

    const jwtPayload = { id: storedToken.user.id, username: storedToken.user.username, role: storedToken.user.role };
    const accessToken = signAccessToken(jwtPayload);

    return { accessToken };
  }

  static async forgotPassword(data: z.infer<typeof ForgotPasswordSchema>) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return; 
    }

    const resetToken = uuidv4();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: `"CodeForge" <${env.SMTP_USER}>`,
      to: user.email,
      subject: 'Reset your CodeForge password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetUrl}" style="padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });
  }

  static async resetPassword(data: z.infer<typeof ResetPasswordSchema>) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: data.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw { statusCode: 400, message: 'Invalid or expired reset token' };
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }

  static async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      throw { statusCode: 400, message: 'Invalid verification token' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifyToken: null,
      },
    });
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const { passwordHash, resetToken, resetTokenExpiry, verifyToken, ...userWithoutSensitiveInfo } = user;
    return userWithoutSensitiveInfo;
  }
}
