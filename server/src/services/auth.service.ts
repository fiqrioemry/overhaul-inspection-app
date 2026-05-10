import cuid from "cuid";
import { Context } from "hono";
import mailer from "@/config/constant/email";
import { prisma } from "@/config/database/prisma";
import redisConfig from "@/config/constant/redis";
import dbConfig from "@/config/constant/database";
import { generateSessionToken } from "@/utils/jwt";
import tokenLimit from "@/config/common/tokenLimit";
import { HTTPException } from "hono/http-exception";
import errorCodes from "@/config/constant/errorCode";
import { sendVerificationLink } from "@/utils/mailer";
import { deleteCookie, setCookie } from "hono/cookie";
import errorMessages from "@/config/constant/errorMessage";
import { UserRepository } from "@/repositories/user.repository";
import { SessionRepository } from "@/repositories/session.repository";
import { hashPassword, hashToken, verifyPassword } from "@/utils/hash";
import { loginResponse, userResponse, verificationType } from "@/models/user.model";
import { ChangePasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest } from "@/schema/auth.validation";
import { generateRandomAvatarURL, generateRandomToken, generateRandomUsername } from "@/utils/generator";

export class AuthService {
  static async createUser(c: Context, request: RegisterRequest): Promise<{ data: { email: string } }> {
    // cek if email exist
    const isEmailExist = await UserRepository.findByEmail(request.email);

    if (isEmailExist) {
      throw new HTTPException(400, { message: errorMessages.emailExists, cause: errorCodes.emailExists });
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

    const randomToken = await prisma.$transaction(async (tx) => {
      const newUser = await UserRepository.create(tx, userData);

      if (!newUser) {
        throw new HTTPException(500, { message: errorMessages.userCreationFailed, cause: errorCodes.userCreationFailed });
      }

      // generate verification
      const randomToken = generateRandomToken();
      const hashedToken = await hashToken(randomToken);

      // create verification data
      const userVerificationData = {
        userId: newUser.id,
        token: hashedToken,
        type: "EMAIL_VERIFICATION" as verificationType,
        expiresAt: new Date(Date.now() + tokenLimit.verifyEmail),
      };

      await UserRepository.createUserVerification(tx, userVerificationData);

      return randomToken;
    });

    // config email data
    const mailConfig = {
      to: request.email,
      subject: mailer.emailVerificationSubject,
      url: `${dbConfig.clientUrl}/verify-email?token=${randomToken}`,
    };

    // send email synchronously
    sendVerificationLink(mailConfig);

    return { data: { email: request.email } };
  }

  // 2. verify email
  static async verifyEmail(c: Context, token: string) {
    const hashedToken = await hashToken(token);

    const isValid = await UserRepository.findUserVerification(hashedToken, "EMAIL_VERIFICATION");

    if (!isValid) {
      throw new HTTPException(400, { message: errorMessages.invalidToken, cause: errorCodes.invalidToken });
    }

    prisma.$transaction(async (tx) => {
      await UserRepository.updateUserVerification(tx, isValid.id, new Date());
      await UserRepository.updateUserActive(tx, { userId: isValid.userId, status: "ACTIVE" });
    });
  }

  static async login(c: Context, request: LoginRequest): Promise<loginResponse> {
    // check email
    const isEmailExist = await UserRepository.findByEmail(request.email);

    if (!isEmailExist) {
      throw new HTTPException(400, { message: errorMessages.invalidCredentials, cause: errorCodes.invalidCredentials });
    }

    const isValid = await verifyPassword({ password: request.password, hash: isEmailExist.passwordHash });

    if (isEmailExist.status === "INACTIVE" || !isEmailExist.verifiedAt) {
      throw new HTTPException(400, { message: errorMessages.emailNotVerified, cause: errorCodes.emailNotVerified });
    }

    if (isEmailExist.status === "BANNED") {
      throw new HTTPException(403, { message: errorMessages.accountBanned, cause: errorCodes.accountBanned });
    }
    // check password
    if (!isValid) {
      throw new HTTPException(400, { message: errorMessages.invalidCredentials, cause: errorCodes.invalidCredentials });
    }

    const randomToken = generateRandomToken();
    const hashedToken = await hashToken(randomToken);

    const sessionPayload = {
      id: cuid(),
      userId: isEmailExist.id,
      token: hashedToken,
      userAgent: c.req.header("user-agent") || "unknown",
      expiresAt: new Date(Date.now() + tokenLimit.sessionToken),
    };

    const newSession = await prisma.$transaction(async (tx) => {
      await UserRepository.updateLastLogin(tx, isEmailExist.id, new Date());
      return await SessionRepository.createSession(tx, sessionPayload);
    });

    const sessionToken = await generateSessionToken({ sub: isEmailExist.id, sid: newSession.id });

    setCookie(c, redisConfig.tokenPrefixDefault, sessionToken);

    return {
      id: isEmailExist.id,
      token: sessionToken,
      expiredAt: sessionPayload.expiresAt,
    };
  }

  static async resendVerificationEmail(c: Context, email: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // return 200 even if the email is not found to prevent email enumeration
      return;
    }

    if (user.verifiedAt) {
      throw new HTTPException(400, { message: errorMessages.emailAlreadyVerified, cause: errorCodes.emailAlreadyVerified });
    }

    const randomToken = generateRandomToken();
    const hashedToken = await hashToken(randomToken);

    const userVerificationData = {
      userId: user.id,
      token: hashedToken,
      type: "EMAIL_VERIFICATION" as verificationType,
      expiresAt: new Date(Date.now() + tokenLimit.verifyEmail),
    };

    await UserRepository.createUserVerification(prisma, userVerificationData);

    const mailConfig = {
      to: email,
      subject: mailer.emailVerificationSubject,
      url: `${dbConfig.clientUrl}/verify-email?token=${randomToken}`,
    };

    sendVerificationLink(mailConfig);
  }

  static async getMe(c: Context, userId: string): Promise<userResponse> {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new HTTPException(404, { message: errorMessages.userNotFound, cause: errorCodes.userNotFound });
    }

    return user;
  }

  static async logout(c: Context, sessionId: string): Promise<void> {
    deleteCookie(c, redisConfig.tokenPrefixDefault);
    await SessionRepository.deleteSessionBySessionId(sessionId);
  }

  static async logoutAll(c: Context, userId: string): Promise<void> {
    await SessionRepository.deleteSessionsByUserId(userId);
    deleteCookie(c, redisConfig.tokenPrefixDefault);
  }

  static async getSessions(c: Context, userId: string) {
    const result = await SessionRepository.findSessionsByUserId(userId);

    const response = result.map((session) => {
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
      throw new HTTPException(404, { message: errorMessages.sessionNotFound, cause: errorCodes.sessionNotFound });
    }

    await SessionRepository.deleteSessionBySessionId(sessionId);
  }

  // change password
  static async changePassword(c: Context, userId: string, request: ChangePasswordRequest): Promise<void> {
    const passwordHash = await UserRepository.getPasswordByUserId(userId);

    if (!passwordHash) {
      throw new HTTPException(404, { message: errorMessages.userNotFound, cause: errorCodes.userNotFound });
    }

    const isValid = await verifyPassword({ password: request.currentPassword, hash: passwordHash });

    if (!isValid) {
      throw new HTTPException(400, { message: errorMessages.invalidCurrentPassword, cause: errorCodes.invalidCurrentPassword });
    }

    const hashedPassword = await hashPassword(request.newPassword);

    await UserRepository.updatePassword(userId, hashedPassword);

    // invalidate all sessions
    await SessionRepository.deleteSessionsByUserId(userId);

    deleteCookie(c, redisConfig.tokenPrefixDefault);
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
      expiresAt: new Date(Date.now() + tokenLimit.passwordReset),
    };

    await UserRepository.createUserVerification(prisma, userVerificationData);

    const mailConfig = {
      to: email,
      subject: mailer.passwordResetSubject,
      url: `${dbConfig.clientUrl}/reset-password?token=${randomToken}`,
    };

    sendVerificationLink(mailConfig);
  }

  static async resetPassword(c: Context, token: string, request: ResetPasswordRequest): Promise<void> {
    const hashedToken = await hashToken(token);

    const verification = await UserRepository.findUserVerification(hashedToken, "PASSWORD_RESET");

    if (!verification) {
      throw new HTTPException(400, { message: errorMessages.invalidToken, cause: errorCodes.invalidToken });
    }

    const hashedPassword = await hashPassword(request.password);

    await prisma.$transaction(async (tx) => {
      await UserRepository.updateUserVerification(tx, verification.id, new Date());
      await UserRepository.updatePassword(verification.userId, hashedPassword);
      await SessionRepository.deleteSessionsByUserId(verification.userId);
    });
  }
}
