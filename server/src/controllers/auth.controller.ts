import { Context } from "hono";
import { successResponse } from "@/utils/response";
import { AuthService } from "@/services/auth.service";
import { loginRequest, registerRequest } from "@/schema/auth.validation";

export class AuthController {
  static async register(c: Context) {
    const request = registerRequest.parse(await c.req.json());
    const response = await AuthService.createUser(c, request);
    return successResponse(c, response.message);
  }

  static async verifyEmail(c: Context) {
    const token = c.req.query("token") || "";
    const response = await AuthService.verifyEmail(c, token);
    return successResponse(c, "Verify email successful", response);
  }

  static async login(c: Context) {
    const request = loginRequest.parse(await c.req.json());
    const response = await AuthService.login(c, request);
    return successResponse(c, "Login successful", response);
  }

  static async logout(c: Context) {
    return successResponse(c, "Logout successful");
  }

  static async logoutAll(c: Context) {
    return successResponse(c, "Logout all sessions successful");
  }

  static async getSessions(c: Context) {
    return successResponse(c, "Get sessions successful");
  }

  static async changePassword(c: Context) {
    return successResponse(c, "Change password successful");
  }

  static async resetPassword(c: Context) {
    return successResponse(c, "Reset password successful");
  }

  static async forgotPassword(c: Context) {
    return successResponse(c, "Forgot password successful");
  }

  static async getMe(c: Context) {
    const user = c.get("user");
    const response = {};
    return successResponse(c, "Get me successful", response);
  }
}
