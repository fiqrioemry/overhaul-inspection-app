import { Context } from "hono";
import { AuthService } from "@/modules/auth/auth.service";
import { responseCreated, responseOK } from "@/utils/response";
import { databaseConfig, OAuthProviderKey } from "@/config/env";
import { authSuccessMessage } from "@/config/constant/auth.constant";
import { changePasswordRequest, forgotPasswordRequest, loginRequest, resendVerificationEmailRequest, resetPasswordRequest, setPasswordRequest, twoFactorChallengeRequest, twoFactorCodeRequest } from "@/modules/auth/auth.schema";

export class AuthController {
  static async verifyEmail(c: Context) {
    console.log("Email verification requested with query:", c.req.query());
    const token = c.req.query("token") || "";
    await AuthService.verifyEmail(c, token);
    return responseOK(c, authSuccessMessage.EMAIL_VERIFICATION_SUCCESS);
  }

  static async resendVerificationEmail(c: Context) {
    console.log("Resend verification email requested with body:", await c.req.json());
    const email = resendVerificationEmailRequest.parse(await c.req.json()).email;
    await AuthService.resendVerificationEmail(c, email);
    return responseOK(c, authSuccessMessage.RESEND_VERIFICATION_EMAIL_SUCCESS);
  }

  static async login(c: Context) {
    console.log("Login requested with body:", await c.req.json());
    const request = loginRequest.parse(await c.req.json());
    const response = await AuthService.login(c, request);
    return responseOK(c, authSuccessMessage.LOGIN_SUCCESS, response);
  }

  static async logout(c: Context) {
    console.log("Logout requested with query:", c.req.query());
    const user = await c.get("user");
    await AuthService.logout(c, user.ssid);
    return responseOK(c, authSuccessMessage.LOGOUT_SUCCESS);
  }

  static async logoutAll(c: Context) {
    const user = await c.get("user");
    await AuthService.logoutAll(c, user.userId);
    return responseOK(c, authSuccessMessage.LOGOUT_ALL_SUCCESS);
  }

  static async getSessions(c: Context) {
    console.log("Get sessions requested with query:", c.req.query());
    const user = await c.get("user");
    const response = await AuthService.getSessions(c, user.userId);
    return responseOK(c, authSuccessMessage.GET_SESSIONS_SUCCESS, response);
  }

  static async deleteSession(c: Context) {
    console.log("Delete session requested with query:", c.req.query());
    const sessionId = c.req.param("sessionId");
    await AuthService.deleteSession(c, sessionId);
    return responseOK(c, authSuccessMessage.DELETE_SESSION_SUCCESS);
  }

  static async changePassword(c: Context) {
    console.log("Change password requested with body:", await c.req.json());
    const user = await c.get("user");
    const request = changePasswordRequest.parse(await c.req.json());
    await AuthService.changePassword(c, user.userId, request);
    return responseOK(c, authSuccessMessage.CHANGE_PASSWORD_SUCCESS);
  }

  static async setPassword(c: Context) {
    console.log("Set password requested");
    const user = await c.get("user");
    const request = setPasswordRequest.parse(await c.req.json());
    await AuthService.setPassword(c, user.userId, request);
    return responseOK(c, authSuccessMessage.SET_PASSWORD_SUCCESS);
  }

  static async resetPassword(c: Context) {
    console.log("Reset password requested with body:", await c.req.json(), "and query:", c.req.query());
    const token = c.req.query("token") as string;
    const request = resetPasswordRequest.parse(await c.req.json());
    await AuthService.resetPassword(c, token, request);
    return responseOK(c, authSuccessMessage.RESET_PASSWORD_SUCCESS);
  }

  static async forgotPassword(c: Context) {
    console.log("Forgot password requested with body:", await c.req.json());
    const request = forgotPasswordRequest.parse(await c.req.json());
    await AuthService.forgotPassword(c, request.email);
    return responseOK(c, authSuccessMessage.FORGOT_PASSWORD_SUCCESS);
  }

  static async getMe(c: Context) {
    console.log("Get me requested with query:", c.req.query());
    const user = c.get("user");
    const response = await AuthService.getMe(c, user.userId);
    return responseOK(c, authSuccessMessage.GET_ME_SUCCESS, response);
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
    console.log("OAuth redirect requested with query:", c.req.query());
    const provider = c.req.param("provider") as OAuthProviderKey;
    const url = await AuthService.getOAuthURL(c, provider);
    return c.redirect(url);
  }

  static async oauthCallback(c: Context) {
    console.log("OAuth callback requested with query:", c.req.query());
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
