import cuid from "cuid";
import { Context } from "hono";
import { cache } from "@/utils/cache";
import { pgsql } from "@/lib/database";
import { pgsql as db } from "@/lib/database";
import { generateSessionToken } from "@/utils/jwt";
import { HTTPException } from "hono/http-exception";
import { sendVerificationLink } from "@/utils/mailer";
import { deleteCookie, setCookie } from "hono/cookie";
import { userAction } from "@/config/constant/user.constant";
import { UserRepository } from "@/modules/users/user.repository";
import { sessionResponse } from "@/modules/sessions/sessions.types";
import { hashPassword, hashToken, verifyPassword } from "@/utils/hash";
import { SessionRepository } from "@/modules/sessions/sessions.repository";
import { mailConfig, redisConfig, databaseConfig, OAuthProviderKey, getOAuthProvider } from "@/config/env";
import { NotificationRepository } from "@/modules/notifications/notification.repository";
import { loginResponse, userResponse, verificationType } from "@/modules/users/user.types";
import { authErrorCode, authErrorMessage, authLimit } from "@/config/constant/auth.constant";
import { generateRandomAvatarURL, generateRandomToken, generateRandomUsername } from "@/utils/generator";
import { NotificationChannel, NotificationStatus, NotificationType, OAuthProvider, Prisma } from "generated/prisma/edge";
import { ChangePasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest, SetPasswordRequest } from "@/modules/auth/auth.schema";
import { buildTOTPUri, generateBackupCodes, generateTOTPSecret, verifyTOTP } from "@/utils/totp";

const oauthStateKey = (provider: OAuthProviderKey, state: string) => `oauth:state:${provider}:${state}`;

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

  static async login(c: Context, request: LoginRequest): Promise<loginResponse | { requiresTwoFactor: true; challengeToken: string }> {
    const isEmailExist = await UserRepository.findByEmail(request.email);

    if (!isEmailExist || isEmailExist?.passwordHash === "") {
      throw new HTTPException(400, { message: authErrorMessage.INVALID_CREDENTIALS, cause: authErrorCode.INVALID_CREDENTIALS });
    }

    if (isEmailExist.status === "INACTIVE" || !isEmailExist.verifiedAt) {
      throw new HTTPException(400, { message: authErrorMessage.EMAIL_NOT_VERIFIED, cause: authErrorCode.EMAIL_NOT_VERIFIED });
    }

    if (isEmailExist.status === "BANNED") {
      throw new HTTPException(403, { message: authErrorMessage.ACCOUNT_BANNED, cause: authErrorCode.ACCOUNT_BANNED });
    }

    const isValid = await verifyPassword({ password: request.password, hash: isEmailExist?.passwordHash! });
    if (!isValid) {
      throw new HTTPException(400, { message: authErrorMessage.INVALID_CREDENTIALS, cause: authErrorCode.INVALID_CREDENTIALS });
    }

    if (isEmailExist.twoFactorEnabled) {
      const challengeToken = generateRandomToken();
      const cacheKey = `2fa:challenge:${challengeToken}`;
      await cache.set(cacheKey, JSON.stringify({ userId: isEmailExist.id, userAgent: c.req.header("user-agent") || "unknown" }), authLimit.TWO_FACTOR_CHALLENGE_TTL);
      return { requiresTwoFactor: true, challengeToken };
    }

    return this._createSession(c, isEmailExist);
  }

  private static async _createSession(c: Context, user: { id: string; name: string; username: string; avatar: string | null; email: string }, userAgent?: string): Promise<loginResponse> {
    const randomToken = generateRandomToken();
    const hashedToken = await hashToken(randomToken);
    const agent = userAgent ?? c.req.header("user-agent") ?? "unknown";

    const sessionPayload = {
      id: cuid(),
      userId: user.id,
      token: hashedToken,
      userAgent: agent,
      expiresAt: new Date(Date.now() + authLimit.SESSION_TOKEN_EXP),
    };

    const newSession = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await UserRepository.updateLastLogin(tx, user.id, new Date());
      const session = await SessionRepository.createSession(tx, sessionPayload);
      await UserRepository.createActivityLog(tx, { userId: user.id, action: userAction.LOGIN, metadata: { userAgent: agent } });
      return session;
    });

    const sessionToken = await generateSessionToken({ sub: user.id, sid: newSession.id });
    setCookie(c, redisConfig.TOKEN_PREFIX_DEFAULT, sessionToken);

    return {
      token: sessionToken,
      expiredAt: sessionPayload.expiresAt,
      user: { id: user.id, name: user.name, username: user.username, avatar: user.avatar, email: user.email },
    };
  }

  // ── 2FA ───────────────────────────────────────────────────────────────────

  static async setup2FA(userId: string): Promise<{ otpauthUrl: string; secret: string }> {
    const user = await UserRepository.findByIdWithTwoFactor(userId);
    if (!user) throw new HTTPException(404, { message: authErrorMessage.USER_NOT_FOUND, cause: authErrorCode.USER_NOT_FOUND });
    if (user.twoFactorEnabled) throw new HTTPException(409, { message: authErrorMessage.TWO_FACTOR_ALREADY_ENABLED, cause: authErrorCode.TWO_FACTOR_ALREADY_ENABLED });

    const secret = generateTOTPSecret();
    await cache.set(`2fa:setup:${userId}`, secret, authLimit.TWO_FACTOR_SETUP_TTL);

    return { otpauthUrl: buildTOTPUri(secret, user.email, "SocialApp"), secret };
  }

  static async verify2FA(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const secret = await cache.get(`2fa:setup:${userId}`);
    if (!secret) throw new HTTPException(400, { message: authErrorMessage.TWO_FACTOR_SETUP_REQUIRED, cause: authErrorCode.TWO_FACTOR_SETUP_REQUIRED });

    if (!verifyTOTP(secret, code)) throw new HTTPException(400, { message: authErrorMessage.TWO_FACTOR_INVALID_CODE, cause: authErrorCode.TWO_FACTOR_INVALID_CODE });

    const rawCodes = generateBackupCodes();
    const hashedCodes = await Promise.all(rawCodes.map((c) => hashPassword(c)));

    await db.$transaction(async (tx) => {
      await UserRepository.updateTwoFactor(userId, { twoFactorEnabled: true, twoFactorSecret: secret, twoFactorBackupCodes: hashedCodes }, tx);
      await cache.del(`2fa:setup:${userId}`);
    });

    return { backupCodes: rawCodes };
  }

  static async disable2FA(userId: string, code: string): Promise<void> {
    const user = await UserRepository.findByIdWithTwoFactor(userId);
    if (!user) throw new HTTPException(404, { message: authErrorMessage.USER_NOT_FOUND, cause: authErrorCode.USER_NOT_FOUND });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) throw new HTTPException(400, { message: authErrorMessage.TWO_FACTOR_NOT_ENABLED, cause: authErrorCode.TWO_FACTOR_NOT_ENABLED });

    const totpValid = verifyTOTP(user.twoFactorSecret, code);
    let backupValid = false;
    if (!totpValid) {
      for (const hashed of user.twoFactorBackupCodes) {
        if (await verifyPassword({ password: code, hash: hashed })) {
          backupValid = true;
          break;
        }
      }
    }

    if (!totpValid && !backupValid) throw new HTTPException(400, { message: authErrorMessage.TWO_FACTOR_INVALID_CODE, cause: authErrorCode.TWO_FACTOR_INVALID_CODE });

    await UserRepository.updateTwoFactor(userId, { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: [] });
  }

  static async challenge2FA(c: Context, challengeToken: string, code: string): Promise<loginResponse> {
    const cacheKey = `2fa:challenge:${challengeToken}`;
    const raw = await cache.get(cacheKey);
    if (!raw) throw new HTTPException(400, { message: authErrorMessage.TWO_FACTOR_CHALLENGE_INVALID, cause: authErrorCode.TWO_FACTOR_CHALLENGE_INVALID });

    const { userId, userAgent } = JSON.parse(raw) as { userId: string; userAgent: string };

    const user = await UserRepository.findByIdWithTwoFactor(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) throw new HTTPException(400, { message: authErrorMessage.TWO_FACTOR_CHALLENGE_INVALID, cause: authErrorCode.TWO_FACTOR_CHALLENGE_INVALID });

    const totpValid = verifyTOTP(user.twoFactorSecret, code);
    let backupValid = false;
    let usedBackupIndex = -1;

    if (!totpValid) {
      for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
        if (await verifyPassword({ password: code, hash: user.twoFactorBackupCodes[i] })) {
          backupValid = true;
          usedBackupIndex = i;
          break;
        }
      }
    }

    if (!totpValid && !backupValid) throw new HTTPException(400, { message: authErrorMessage.TWO_FACTOR_INVALID_CODE, cause: authErrorCode.TWO_FACTOR_INVALID_CODE });

    if (backupValid && usedBackupIndex >= 0) {
      const remaining = user.twoFactorBackupCodes.filter((_, i) => i !== usedBackupIndex);
      await UserRepository.updateTwoFactor(userId, { twoFactorEnabled: true, twoFactorBackupCodes: remaining });
    }

    await cache.del(cacheKey);

    return this._createSession(c, { id: user.id, name: user.name, username: user.username, avatar: user.avatar, email: user.email }, userAgent);
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

  static async getMe(c: Context, userId: string): Promise<userResponse & { twoFactorEnabled: boolean }> {
    const result = await UserRepository.findByIdWithTwoFactor(userId);

    if (!result) {
      throw new HTTPException(404, { message: authErrorMessage.USER_NOT_FOUND, cause: authErrorCode.USER_NOT_FOUND });
    }

    return {
      id: result.id,
      name: result.name,
      username: result.username,
      avatar: result.avatar,
      email: result.email,
      role: result.role,
      lastLogin: result.lastLogin,
      joinedAt: result.createdAt,
      lastChangePasswordAt: result.lastChangePasswordAt,
      hasPassword: result.passwordHash !== "",
      twoFactorEnabled: result.twoFactorEnabled,
    };
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

  // change password (requires current password — for accounts that already have one)
  static async changePassword(c: Context, userId: string, request: ChangePasswordRequest): Promise<void> {
    const passwordHash = await UserRepository.getPasswordByUserId(userId);

    if (passwordHash === null) {
      throw new HTTPException(404, { message: authErrorMessage.USER_NOT_FOUND, cause: authErrorCode.USER_NOT_FOUND });
    }

    if (passwordHash === "") {
      throw new HTTPException(400, { message: authErrorMessage.NO_PASSWORD_SET, cause: authErrorCode.NO_PASSWORD_SET });
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

  // set password (for OAuth accounts that have no password yet)
  static async setPassword(c: Context, userId: string, request: SetPasswordRequest): Promise<void> {
    const passwordHash = await UserRepository.getPasswordByUserId(userId);

    if (passwordHash === null) {
      throw new HTTPException(404, { message: authErrorMessage.USER_NOT_FOUND, cause: authErrorCode.USER_NOT_FOUND });
    }

    if (passwordHash !== "") {
      throw new HTTPException(400, { message: authErrorMessage.PASSWORD_ALREADY_SET, cause: authErrorCode.PASSWORD_ALREADY_SET });
    }

    const hashedPassword = await hashPassword(request.newPassword);
    await UserRepository.updatePassword(userId, hashedPassword);
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

  static async getOAuthURL(c: Context, providerKey: OAuthProviderKey): Promise<string> {
    const provider = getOAuthProvider(providerKey);

    // Random state untuk CSRF protection
    const state = generateRandomToken();

    // Simpan state di Redis, TTL 10 menit
    await cache.set(
      oauthStateKey(providerKey, state),
      "1",
      authLimit.OAUTH_STATE_TTL, // tambahkan: OAUTH_STATE_TTL: 10 * 60
    );

    return provider.getAuthURL(state);
  }

  static async handleOAuthCallback(c: Context, providerKey: OAuthProviderKey, code: string, state: string): Promise<loginResponse> {
    // 1. Validasi state (anti-CSRF)
    const stateKey = oauthStateKey(providerKey, state);
    const isValidState = await cache.get(stateKey);

    if (!isValidState) {
      throw new HTTPException(400, {
        message: authErrorMessage.OAUTH_STATE_INVALID,
        cause: authErrorCode.OAUTH_STATE_INVALID,
      });
    }

    // One-time use — hapus setelah dipakai
    await cache.del(stateKey);

    const oauthProvider = getOAuthProvider(providerKey);
    const providerEnumKey = providerKey.toUpperCase() as keyof typeof OAuthProvider;

    let tokens: Awaited<ReturnType<typeof oauthProvider.exchangeCode>>;
    let oauthUser: Awaited<ReturnType<typeof oauthProvider.getUserInfo>>;

    try {
      tokens = await oauthProvider.exchangeCode(code);
      oauthUser = await oauthProvider.getUserInfo(tokens.accessToken);
    } catch (err) {
      console.error(`[OAuth:${providerKey}] Error:`, err);
      throw new HTTPException(400, {
        message: authErrorMessage.OAUTH_FAILED,
        cause: authErrorCode.OAUTH_FAILED,
      });
    }

    if (!oauthUser.email) {
      throw new HTTPException(400, {
        message: authErrorMessage.OAUTH_EMAIL_NOT_PROVIDED,
        cause: authErrorCode.OAUTH_EMAIL_NOT_PROVIDED,
      });
    }

    const provider = OAuthProvider[providerEnumKey];

    // 3. Resolve user: cari by oauthAccount → fallback email → register baru
    let user = await UserRepository.findByOAuthProvider(provider, oauthUser.providerAccountId);

    if (!user) {
      const existingUser = await UserRepository.findByEmail(oauthUser.email);

      if (existingUser) {
        // Email sudah terdaftar (akun biasa) → link OAuth account ke user ini
        user = existingUser;
      } else {
        // Belum terdaftar sama sekali → register otomatis
        const username = generateRandomUsername(oauthUser.name);
        user = await pgsql.$transaction(async (tx) => {
          const newUser = await UserRepository.createOAuthUser(tx, {
            email: oauthUser.email,
            name: oauthUser.name,
            username,
            avatar: oauthUser.avatar || generateRandomAvatarURL(username),
          });

          // Default notification settings — sama seperti register biasa
          const notifPayload = Object.values(NotificationType).map((type) => ({
            userId: newUser.id,
            type,
            channel: NotificationChannel.IN_APP,
            status: NotificationStatus.ENABLED,
            createdAt: new Date(),
          }));
          await NotificationRepository.createNotificationSettings(tx, notifPayload);

          await UserRepository.createActivityLog(tx, {
            userId: newUser.id,
            action: userAction.LOGIN,
            metadata: { provider: providerKey, firstLogin: true },
          });

          return {
            ...newUser,
            passwordHash: null,
          };
        });
      }
    }

    // 4. Cek status akun
    if (user?.status === "BANNED") {
      throw new HTTPException(403, {
        message: authErrorMessage.ACCOUNT_BANNED,
        cause: authErrorCode.ACCOUNT_BANNED,
      });
    }

    // 5. Simpan / update OAuthAccount (refresh token setiap login)
    await UserRepository.upsertOAuthAccount(null, {
      userId: user?.id!,
      provider,
      providerAccountId: oauthUser.providerAccountId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });

    // 6. Buat session — identik dengan login biasa
    const randomToken = generateRandomToken();
    const hashedToken = await hashToken(randomToken);

    const sessionPayload = {
      id: cuid(),
      userId: user?.id!,
      token: hashedToken,
      userAgent: c.req.header("user-agent") || "unknown",
      expiresAt: new Date(Date.now() + authLimit.SESSION_TOKEN_EXP),
    };

    const newSession = await pgsql.$transaction(async (tx) => {
      await UserRepository.updateLastLogin(tx, user!.id, new Date());
      const session = await SessionRepository.createSession(tx, sessionPayload);
      await UserRepository.createActivityLog(tx, {
        userId: user?.id!,
        action: userAction.LOGIN,
        metadata: { userAgent: sessionPayload.userAgent, provider: providerKey },
      });
      return session;
    });

    const sessionToken = await generateSessionToken({ sub: user?.id!, sid: newSession.id });
    setCookie(c, redisConfig.TOKEN_PREFIX_DEFAULT, sessionToken);

    return {
      token: sessionToken,
      expiredAt: sessionPayload.expiresAt,
      user: {
        id: user?.id!,
        name: user?.name!,
        username: user?.username!,
        avatar: user?.avatar!,
        email: user?.email!,
      },
    };
  }
}
