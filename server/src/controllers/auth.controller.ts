import { Context } from "hono";
import { responseCreated, responseOK } from "@/utils/response";
import { AuthService } from "@/services/auth.service";
import successMessages from "@/config/constant/successMessage";
import { changePasswordRequest, forgotPasswordRequest, loginRequest, registerRequest, resendVerificationEmailRequest, resetPasswordRequest } from "@/schema/auth.validation";

export class AuthController {
  static async register(c: Context) {
    const request = registerRequest.parse(await c.req.json());
    const response = await AuthService.createUser(c, request);
    return responseCreated(c, successMessages.registerSuccess, response.data.email);
  }

  static async verifyEmail(c: Context) {
    const token = c.req.query("token") || "";
    await AuthService.verifyEmail(c, token);
    return responseOK(c, successMessages.emailVerified);
  }

  static async resendVerificationEmail(c: Context) {
    const email = resendVerificationEmailRequest.parse(await c.req.json()).email;
    await AuthService.resendVerificationEmail(c, email);
    return responseOK(c, successMessages.emailSent);
  }

  static async login(c: Context) {
    const request = loginRequest.parse(await c.req.json());
    const response = await AuthService.login(c, request);
    return responseOK(c, successMessages.loginSuccess, response);
  }

  static async logout(c: Context) {
    const user = await c.get("user");
    await AuthService.logout(c, user.ssid);
    return responseOK(c, successMessages.logoutSuccess);
  }

  static async logoutAll(c: Context) {
    const user = await c.get("user");
    await AuthService.logoutAll(c, user.userId);
    return responseOK(c, successMessages.logoutAll);
  }

  static async getSessions(c: Context) {
    const user = await c.get("user");
    const response = await AuthService.getSessions(c, user.userId);
    return responseOK(c, successMessages.getSessions, response);
  }

  static async deleteSession(c: Context) {
    const sessionId = c.req.param("sessionId");
    await AuthService.deleteSession(c, sessionId);
    return responseOK(c, successMessages.deleteSession);
  }

  static async changePassword(c: Context) {
    const user = await c.get("user");
    const request = changePasswordRequest.parse(await c.req.json());
    await AuthService.changePassword(c, user.userId, request);
    return responseOK(c, successMessages.changePassword);
  }

  static async resetPassword(c: Context) {
    const token = c.req.query("token") as string;
    const request = resetPasswordRequest.parse(await c.req.json());
    await AuthService.resetPassword(c, token, request);
    return responseOK(c, successMessages.resetPassword);
  }

  static async forgotPassword(c: Context) {
    const request = forgotPasswordRequest.parse(await c.req.json());
    await AuthService.forgotPassword(c, request.email);
    return responseOK(c, successMessages.forgotPassword);
  }

  static async getMe(c: Context) {
    const user = c.get("user");
    const response = await AuthService.getMe(c, user.userId);
    return responseOK(c, successMessages.getProfile, response);
  }
}
