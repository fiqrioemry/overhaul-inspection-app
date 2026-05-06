import { Context } from "hono";
import cuid from "cuid";
import { setCookie } from "hono/cookie";
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

export class AuthService {
  static async createUser(c: Context, request: RegisterRequest): Promise<{ message: string }> {
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

    const randomToken = prisma.$transaction(async (tx) => {
      // create user into database
      const newUser = await UserRepository.create(tx, userData);

      // throw error if failed
      if (!newUser) {
        throw new HTTPException(500, { message: errorMessages.userCreationFailed, cause: errorCodes.userCreationFailed });
      }

      // generate verification
      const randomToken = crypto.randomUUID();
      const hashedToken = hashToken(randomToken);

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

    return { message: "Verification email sent. Please check your inbox." };
  }

  // 2. verify email
  static async verifyEmail(c: Context, token: string): Promise<{ message: string }> {
    // hash the token to look up the cached registration data
    const hashedToken = hashToken(token);

    // get verification data record
    const isValid = await UserRepository.findUserVerification(hashedToken, "EMAIL_VERIFICATION");
    if (!isValid) {
      throw new HTTPException(400, { message: errorMessages.invalidToken, cause: errorCodes.invalidToken });
    }

    prisma.$transaction(async (tx) => {
      // mark the token as used
      await UserRepository.UpdateUserVerification(tx, isValid.id, new Date());

      // update user to verified and isActive
      // verifiedAt = new Date();
      await UserRepository.updateUserActive(tx, { userId: isValid.userId, status: "ACTIVE" });
    });

    return { message: "Email verified successfully" };
  }

  static async login(c: Context, request: { email: string; password: string }): Promise<{ data: UserResponse; message: string }> {
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
    const hashedToken = hashToken(randomToken);
    const sessionPayload = {
      id: cuid(),
      userId: user.id,
      token: hashedToken,
      userAgent: c.req.header("user-agent") || "unknown",
      expiresAt: new Date(Date.now() + tokenLimit.sessionToken),
    };

    const newSession = await SessionRepository.createSession(sessionPayload);

    const sessionToken = await generateSessionToken({ sub: user.id, sid: newSession.id });

    setCookie(c, redisConfig.tokenPrefixDefault, sessionToken);

    const response = userResponse.parse(user);

    return { data: response, message: "Login successful" };
  }
}
