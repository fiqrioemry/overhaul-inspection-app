import cuid from "cuid";
import { Context } from "hono";
import { pgsql as db } from "@/lib/database";
import { generateSessionToken } from "@/utils/jwt";
import { HTTPException } from "hono/http-exception";
import { sendVerificationLink } from "@/utils/mailer";
import { deleteCookie, setCookie } from "hono/cookie";
import { userAction } from "@/config/constant/user.constant";
import { UserRepository } from "@/modules/users/user.repository";
import { mailConfig, redisConfig, databaseConfig } from "@/config/env";
import { hashPassword, hashToken, verifyPassword } from "@/utils/hash";
import { SessionRepository } from "@/modules/sessions/sessions.repository";
import { loginResponse, userResponse, verificationType } from "@/modules/users/user.types";
import { NotificationRepository } from "@/modules/notifications/notification.repository";
import { authErrorCode, authErrorMessage, authLimit } from "@/config/constant/auth.constant";
import { NotificationChannel, NotificationStatus, NotificationType, Prisma } from "generated/prisma/edge";
import { generateRandomAvatarURL, generateRandomToken, generateRandomUsername } from "@/utils/generator";
import { ChangePasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest } from "@/modules/auth/auth.schema";
import { sessionResponse } from "../sessions/sessions.types";

export class AuthService {
  static async createUser(c: Context, request: RegisterRequest): Promise<{ data: { email: string } }> {
    // cek if email exist
    const isEmailExist = await UserRepository.findByEmail(request.email);

    if (isEmailExist) {
      throw new HTTPException(400, { message: authErrorMessage.EMAIL_EXISTS, cause: authErrorCode.EMAIL_EXISTS });
    }

    // hash password
    const hashedPassword = await hashPassword(request.password);
    const username = generateRandomUsername(request.name);

    // assign user data payload
    const userData = {
      email: request.email,
      passwordHash: hashedPassword,
      name: request.name,
      avatar: generateRandomAvatarURL(username),
      username: username,
    };

    const randomToken = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await UserRepository.create(tx, userData);

      if (!newUser) {
        throw new HTTPException(500, { message: authErrorMessage.USER_CREATION_FAILED, cause: authErrorCode.USER_CREATION_FAILED });
      }

      // generate verification
      const randomToken = generateRandomToken();
      const hashedToken = await hashToken(randomToken);

      // create verification data
      const userVerificationData = {
        userId: newUser.id,
        token: hashedToken,
        type: "EMAIL_VERIFICATION" as verificationType,
        expiresAt: new Date(Date.now() + authLimit.VERIFY_EMAIL_EXP),
      };

      await UserRepository.createUserVerification(tx, userVerificationData);

      const payload = Object.values(NotificationType).map((type) => ({
        userId: newUser.id,
        type,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.ENABLED,
        createdAt: new Date(),
      }));

      await NotificationRepository.createNotificationSettings(tx, payload);

      return randomToken;
    });

    // config email data
    const mailSetup = {
      to: request.email,
      subject: mailConfig.EMAIL_VERIFICATION_SUBJECT,
      url: `${databaseConfig.CLIENT_URL}/verify-email?token=${randomToken}`,
    };

    // send email synchronously
    sendVerificationLink(mailSetup);

    return { data: { email: request.email } };
  }

  // 2. verify email
  static async verifyEmail(c: Context, token: string) {
    if (!token) {
      throw new HTTPException(400, { message: authErrorMessage.TOKEN_REQUIRED, cause: authErrorCode.TOKEN_REQUIRED });
    }
    const hashedToken = await hashToken(token);

    const isValid = await UserRepository.findUserVerification(hashedToken, "EMAIL_VERIFICATION");

    if (!isValid) {
      throw new HTTPException(400, { message: authErrorMessage.INVALID_TOKEN, cause: authErrorCode.INVALID_TOKEN });
    }

    db.$transaction(async (tx: Prisma.TransactionClient) => {
      await UserRepository.updateUserVerification(tx, isValid.id, new Date());
      await UserRepository.updateUserActive(tx, { userId: isValid.userId, status: "ACTIVE" });
    });
  }

  static async login(c: Context, request: LoginRequest): Promise<loginResponse> {
    // check email
    const isEmailExist = await UserRepository.findByEmail(request.email);

    if (!isEmailExist) {
      throw new HTTPException(400, { message: authErrorMessage.INVALID_CREDENTIALS, cause: authErrorCode.INVALID_CREDENTIALS });
    }

    const isValid = await verifyPassword({ password: request.password, hash: isEmailExist.passwordHash });

    if (isEmailExist.status === "INACTIVE" || !isEmailExist.verifiedAt) {
      throw new HTTPException(400, { message: authErrorMessage.EMAIL_NOT_VERIFIED, cause: authErrorCode.EMAIL_NOT_VERIFIED });
    }

    if (isEmailExist.status === "BANNED") {
      throw new HTTPException(403, { message: authErrorMessage.ACCOUNT_BANNED, cause: authErrorCode.ACCOUNT_BANNED });
    }
    // check password
    if (!isValid) {
      throw new HTTPException(400, { message: authErrorMessage.INVALID_CREDENTIALS, cause: authErrorCode.INVALID_CREDENTIALS });
    }

    const randomToken = generateRandomToken();
    const hashedToken = await hashToken(randomToken);

    const sessionPayload = {
      id: cuid(),
      userId: isEmailExist.id,
      token: hashedToken,
      userAgent: c.req.header("user-agent") || "unknown",
      expiresAt: new Date(Date.now() + authLimit.SESSION_TOKEN_EXP),
    };

    const newSession = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await UserRepository.updateLastLogin(tx, isEmailExist.id, new Date());
      const session = await SessionRepository.createSession(tx, sessionPayload);

      await UserRepository.createActivityLog(tx, {
        userId: isEmailExist.id,
        action: userAction.LOGIN,
        metadata: {
          userAgent: sessionPayload.userAgent,
        },
      });

      return session;
    });

    const sessionToken = await generateSessionToken({ sub: isEmailExist.id, sid: newSession.id });

    setCookie(c, redisConfig.TOKEN_PREFIX_DEFAULT, sessionToken);

    return {
      token: sessionToken,
      expiredAt: sessionPayload.expiresAt,
      user: {
        id: isEmailExist.id,
        name: isEmailExist.name,
        username: isEmailExist.username,
        avatar: isEmailExist.avatar,
        email: isEmailExist.email,
      },
    };
  }

  static async resendVerificationEmail(c: Context, email: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // return 200 even if the email is not found to prevent email enumeration
      return;
    }

    if (user.verifiedAt) {
      throw new HTTPException(400, { message: authErrorMessage.EMAIL_ALREADY_VERIFIED, cause: authErrorCode.EMAIL_ALREADY_VERIFIED });
    }

    const randomToken = generateRandomToken();
    const hashedToken = await hashToken(randomToken);

    const userVerificationData = {
      userId: user.id,
      token: hashedToken,
      type: "EMAIL_VERIFICATION" as verificationType,
      expiresAt: new Date(Date.now() + authLimit.VERIFY_EMAIL_EXP),
    };

    await UserRepository.createUserVerification(db, userVerificationData);

    const mailSetup = {
      to: email,
      subject: mailConfig.EMAIL_VERIFICATION_SUBJECT,
      url: `${databaseConfig.CLIENT_URL}/verify-email?token=${randomToken}`,
    };

    sendVerificationLink(mailSetup);
  }

  static async getMe(c: Context, userId: string): Promise<userResponse> {
    const result = await UserRepository.findById(userId);

    if (!result) {
      throw new HTTPException(404, { message: authErrorMessage.USER_NOT_FOUND, cause: authErrorCode.USER_NOT_FOUND });
    }

    const user = {
      id: result.id,
      name: result.name,
      username: result.username,
      avatar: result?.avatar,
      email: result.email,
      lastLogin: result.lastLogin,
      joinedAt: result.createdAt,
      lastChangePasswordAt: result.lastChangePasswordAt,
    };
    return user;
  }

  static async logout(c: Context, sessionId: string): Promise<void> {
    deleteCookie(c, redisConfig.TOKEN_PREFIX_DEFAULT);
    await SessionRepository.deleteSessionBySessionId(sessionId);
  }

  static async logoutAll(c: Context, userId: string): Promise<void> {
    await SessionRepository.deleteSessionsByUserId(userId);
    deleteCookie(c, redisConfig.TOKEN_PREFIX_DEFAULT);
  }

  static async getSessions(c: Context, userId: string): Promise<sessionResponse[]> {
    const result = await SessionRepository.findSessionsByUserId(userId);

    const response = result.map((session: any) => {
      return {
        id: session.id,
        userId: session.userId,
        userAgent: session.userAgent,
        expiresAt: session.expiresAt,
        loginAt: session.createdAt,
      };
    });
    return response;
  }

  static async deleteSession(c: Context, sessionId: string): Promise<void> {
    const session = await SessionRepository.getSessionById(sessionId);

    if (!session) {
      throw new HTTPException(404, { message: authErrorMessage.SESSION_NOT_FOUND, cause: authErrorCode.SESSION_NOT_FOUND });
    }

    await SessionRepository.deleteSessionBySessionId(sessionId);
  }

  // change password
  static async changePassword(c: Context, userId: string, request: ChangePasswordRequest): Promise<void> {
    const passwordHash = await UserRepository.getPasswordByUserId(userId);

    if (!passwordHash) {
      throw new HTTPException(404, { message: authErrorMessage.USER_NOT_FOUND, cause: authErrorCode.USER_NOT_FOUND });
    }

    const isValid = await verifyPassword({ password: request.currentPassword, hash: passwordHash });

    if (!isValid) {
      throw new HTTPException(400, { message: authErrorMessage.INVALID_CREDENTIALS, cause: authErrorCode.INVALID_CREDENTIALS });
    }

    const hashedPassword = await hashPassword(request.newPassword);

    await UserRepository.updatePassword(userId, hashedPassword);

    // invalidate all sessions
    await SessionRepository.deleteSessionsByUserId(userId);

    deleteCookie(c, redisConfig.TOKEN_PREFIX_DEFAULT);
  }

  static async forgotPassword(c: Context, email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // return 200 even if the email is not found to prevent email enumeration
      return;
    }

    const randomToken = generateRandomToken();
    const hashedToken = await hashToken(randomToken);

    const userVerificationData = {
      userId: user.id,
      token: hashedToken,
      type: "PASSWORD_RESET" as verificationType,
      expiresAt: new Date(Date.now() + authLimit.RESET_PASSWORD_EXP),
    };

    await UserRepository.createUserVerification(db, userVerificationData);

    const mailSetup = {
      to: email,
      subject: mailConfig.PASSWORD_RESET_SUBJECT,
      url: `${databaseConfig.CLIENT_URL}/reset-password?token=${randomToken}`,
    };

    sendVerificationLink(mailSetup);
  }

  static async resetPassword(c: Context, token: string, request: ResetPasswordRequest): Promise<void> {
    const hashedToken = await hashToken(token);

    const verification = await UserRepository.findUserVerification(hashedToken, "PASSWORD_RESET");

    if (!verification) {
      throw new HTTPException(400, { message: authErrorMessage.INVALID_TOKEN, cause: authErrorCode.INVALID_TOKEN });
    }

    const hashedPassword = await hashPassword(request.password);

    await db.$transaction(async (tx) => {
      await UserRepository.updateUserVerification(tx, verification.id, new Date());
      await UserRepository.updatePassword(verification.userId, hashedPassword);
      await SessionRepository.deleteSessionsByUserId(verification.userId);
    });
  }
}
