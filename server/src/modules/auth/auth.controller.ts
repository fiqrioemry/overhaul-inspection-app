import { Context } from "hono";
import { AuthService } from "@/modules/auth/auth.service";
import { responseCreated, responseOK } from "@/utils/response";
import { databaseConfig, OAuthProviderKey } from "@/config/env";
import { authSuccessMessage } from "@/config/constant/auth.constant";
import {
  changePasswordRequest,
  forgotPasswordRequest,
  loginRequest,
  resendVerificationEmailRequest,
  resetPasswordRequest,
  setPasswordRequest,
  twoFactorChallengeRequest,
  twoFactorCodeRequest,
} from "@/modules/auth/auth.schema";

export class AuthController {
  static async verifyEmail(c: Context) {
    const token = c.req.query("token") || "";
    await AuthService.verifyEmail(c, token);
    return responseOK(c, authSuccessMessage.EMAIL_VERIFICATION_SUCCESS);
  }

  static async resendVerificationEmail(c: Context) {
    const email = resendVerificationEmailRequest.parse(await c.req.json()).email;
    await AuthService.resendVerificationEmail(c, email);
    return responseOK(c, authSuccessMessage.RESEND_VERIFICATION_EMAIL_SUCCESS);
  }

  static async login(c: Context) {
    const request = loginRequest.parse(await c.req.json());
    const response = await AuthService.login(c, request);
    return responseOK(c, authSuccessMessage.LOGIN_SUCCESS, response);
  }

  static async logout(c: Context) {
    const user = await c.get("user");
    await AuthService.logout(c, user.ssid);
    return responseOK(c, authSuccessMessage.LOGOUT_SUCCESS);
  }

  static async logoutAll(c: Context) {
    const user = await c.get("user");
    await AuthService.logoutAll(c, user.userId);
    return responseOK(c, authSuccessMessage.LOGOUT_ALL_SUCCESS);
  }

  static async refreshToken(c: Context) {
    const user = c.get("user");
    const response = await AuthService.refreshToken(c, user.ssid, user.userId);
    return responseOK(c, "Token refreshed successfully", response);
  }

  static async getSessions(c: Context) {
    const user = await c.get("user");
    const response = await AuthService.getSessions(c, user.userId);
    return responseOK(c, authSuccessMessage.GET_SESSIONS_SUCCESS, response);
  }

  static async deleteSession(c: Context) {
    const sessionId = c.req.param("sessionId");
    await AuthService.deleteSession(c, sessionId);
    return responseOK(c, authSuccessMessage.DELETE_SESSION_SUCCESS);
  }

  static async changePassword(c: Context) {
    const user = await c.get("user");
    const request = changePasswordRequest.parse(await c.req.json());
    await AuthService.changePassword(c, user.userId, request);
    return responseOK(c, authSuccessMessage.CHANGE_PASSWORD_SUCCESS);
  }

  static async setPassword(c: Context) {
    const user = await c.get("user");
    const request = setPasswordRequest.parse(await c.req.json());
    await AuthService.setPassword(c, user.userId, request);
    return responseOK(c, authSuccessMessage.SET_PASSWORD_SUCCESS);
  }

  static async resetPassword(c: Context) {
    const token = c.req.query("token") as string;
    const request = resetPasswordRequest.parse(await c.req.json());
    await AuthService.resetPassword(c, token, request);
    return responseOK(c, authSuccessMessage.RESET_PASSWORD_SUCCESS);
  }

  static async forgotPassword(c: Context) {
    const request = forgotPasswordRequest.parse(await c.req.json());
    await AuthService.forgotPassword(c, request.email);
    return responseOK(c, authSuccessMessage.FORGOT_PASSWORD_SUCCESS);
  }

  static async getMe(c: Context) {
    const user = c.get("user");
    const response = await AuthService.getMe(c, user.userId);
    return responseOK(c, "Authenticated user retrieved successfully", response);
  }

  static async setup2FA(c: Context) {
    const user = c.get("user");
    const response = await AuthService.setup2FA(user.userId);
    return responseOK(c, authSuccessMessage.TWO_FACTOR_SETUP_SUCCESS, response);
  }

  static async verify2FA(c: Context) {
    const user = c.get("user");
    const { code } = twoFactorCodeRequest.parse(await c.req.json());
    const response = await AuthService.verify2FA(user.userId, code);
    return responseOK(c, authSuccessMessage.TWO_FACTOR_ENABLED, response);
  }

  static async disable2FA(c: Context) {
    const user = c.get("user");
    const { code } = twoFactorCodeRequest.parse(await c.req.json());
    await AuthService.disable2FA(user.userId, code);
    return responseOK(c, authSuccessMessage.TWO_FACTOR_DISABLED);
  }

  static async challenge2FA(c: Context) {
    const { challengeToken, code } = twoFactorChallengeRequest.parse(await c.req.json());
    const response = await AuthService.challenge2FA(c, challengeToken, code);
    return responseOK(c, authSuccessMessage.TWO_FACTOR_CHALLENGE_PASSED, response);
  }

  static async oauthRedirect(c: Context) {
    const provider = c.req.param("provider") as OAuthProviderKey;
    const url = await AuthService.getOAuthURL(c, provider);
    return c.redirect(url);
  }

  static async oauthCallback(c: Context) {
    const provider = c.req.param("provider") as OAuthProviderKey;
    const { code, state, error } = c.req.query() as Record<string, string>;

    if (error) {
      return c.redirect(`${databaseConfig.CLIENT_URL}/login?error=oauth_cancelled&provider=${provider}`);
    }

    try {
      await AuthService.handleOAuthCallback(c, provider, code, state);
      return c.redirect(`${databaseConfig.CLIENT_URL}/oauth/callback?success=true&provider=${provider}`);
    } catch (err) {
      console.error(`[OAuth:${provider}] Callback error:`, err);
      return c.redirect(`${databaseConfig.CLIENT_URL}/login?error=oauth_failed&provider=${provider}`);
    }
  }
}
