import { Context } from "hono";
import cuid from "cuid";
import { deleteCookie, setCookie } from "hono/cookie";
import { prisma } from "@/config/database/prisma";
import { generateSessionToken } from "@/utils/jwt";
import { HTTPException } from "hono/http-exception";
import { sendVerificationLink } from "@/utils/mailer";
import { VerificationType } from "generated/prisma/edge";
import { UserRepository } from "@/repositories/user.repository";
import { hashPassword, hashToken, verifyPassword } from "@/utils/hash";
import { SessionRepository } from "@/repositories/session.repository";
import { RegisterRequest, UserResponse, userResponse } from "@/schema/auth.validation";
import errorMessages from "@/config/constant/errorMessage";
import errorCodes from "@/config/constant/errorCode";
import tokenLimit from "@/config/common/tokenLimit";
import mailer from "@/config/constant/email";
import dbConfig from "@/config/constant/database";
import redisConfig from "@/config/constant/redis";
import { SessionResponse, sessionResponse } from "@/schema/session.validation";

export class AuthService {
  static async createUser(c: Context, request: RegisterRequest): Promise<{ data: { email: string } }> {
    // cek if email exist
    const isEmailExist = await UserRepository.findByEmail(request.email);
    if (isEmailExist) {
      throw new HTTPException(400, { message: errorMessages.emailExists, cause: errorCodes.emailExists });
    }

    // hash password
    const hashedPassword = await hashPassword(request.password);
    const random = Math.floor(1000 + Math.random() * 9000); // generate a random 4-digit number
    const randomAvatarURL = `https://api.dicebear.com/6.x/initials/svg?seed=${request.name}${random}`; // generate a random avatar URL using the name and random number
    const username = `${request.name.replace(/\s+/g, "").toLowerCase()}${random}`;

    // assign user data payload
    const userData = {
      email: request.email,
      passwordHash: hashedPassword,
      name: request.name,
      avatar: randomAvatarURL,
      username: username,
    };

    const randomToken = await prisma.$transaction(async (tx) => {
      // create user into database
      const newUser = await UserRepository.create(tx, userData);

      // throw error if failed
      if (!newUser) {
        throw new HTTPException(500, { message: errorMessages.userCreationFailed, cause: errorCodes.userCreationFailed });
      }

      // generate verification
      const randomToken = crypto.randomUUID();
      const hashedToken = await hashToken(randomToken);

      // create verification data
      const userVerificationData = {
        userId: newUser.id,
        token: hashedToken,
        type: "EMAIL_VERIFICATION" as VerificationType,
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
      await UserRepository.UpdateUserVerification(tx, isValid.id, new Date());
      await UserRepository.updateUserActive(tx, { userId: isValid.userId, status: "ACTIVE" });
    });
  }

  static async login(c: Context, request: { email: string; password: string }): Promise<{ data: UserResponse }> {
    // check email
    const user = await UserRepository.findByEmail(request.email);
    if (!user) {
      throw new HTTPException(400, { message: errorMessages.invalidCredentials, cause: errorCodes.invalidCredentials });
    }

    const isValid = await verifyPassword({ password: request.password, hash: user.passwordHash });

    // check password
    if (!isValid) {
      throw new HTTPException(400, { message: errorMessages.invalidCredentials, cause: errorCodes.invalidCredentials });
    }

    const randomToken = crypto.randomUUID();
    const hashedToken = await hashToken(randomToken);
    const sessionPayload = {
      id: cuid(),
      userId: user.id,
      token: hashedToken,
      userAgent: c.req.header("user-agent") || "unknown",
      expiresAt: new Date(Date.now() + tokenLimit.sessionToken),
    };

    const newSession = await prisma.$transaction(async (tx) => {
      await UserRepository.updateLastLogin(tx, user.id, new Date());
      return await SessionRepository.createSession(tx, sessionPayload);
    });

    const sessionToken = await generateSessionToken({ sub: user.id, sid: newSession.id });

    setCookie(c, redisConfig.tokenPrefixDefault, sessionToken);

    const response = userResponse.parse(user);

    return { data: response };
  }

  static async resendVerificationEmail(c: Context, email: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // for security reason, we will not return error if email not found
      return;
    }

    const randomToken = crypto.randomUUID();
    const hashedToken = await hashToken(randomToken);

    const userVerificationData = {
      userId: user.id,
      token: hashedToken,
      type: "EMAIL_VERIFICATION" as VerificationType,
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

  static async getMe(c: Context, userId: string): Promise<UserResponse> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new HTTPException(404, { message: errorMessages.userNotFound, cause: errorCodes.userNotFound });
    }
    const response = userResponse.parse(user);

    return response;
  }

  static async logout(c: Context, sessionId: string): Promise<void> {
    deleteCookie(c, redisConfig.tokenPrefixDefault);
    await SessionRepository.deleteSessionBySessionId(sessionId);
  }

  static async logoutAll(c: Context, userId: string): Promise<void> {
    deleteCookie(c, redisConfig.tokenPrefixDefault);
    await SessionRepository.deleteSessionsByUserId(userId);
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
    await SessionRepository.deleteSessionBySessionId(sessionId);
  }
}
