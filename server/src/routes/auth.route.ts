import { Hono } from "hono";
import { limitter } from "@/middlewares/limitter";
import authLimiter from "@/config/common/authLimit";
import { AuthController as ctrl } from "@/controllers/auth.controller";
import { protect } from "@/middlewares/auth";

const auth = new Hono();
auth.post("/login", limitter(authLimiter.login), ctrl.login);
auth.post("/logout", protect, ctrl.logout);
auth.post("/sessions/revoke", protect, ctrl.logoutAll);
auth.delete("/sessions/:sessionId", protect, ctrl.deleteSession);
auth.get("/sessions", protect, limitter(authLimiter.sessions), ctrl.getSessions);
auth.patch("/change-password", protect, limitter(authLimiter.passwordChange), ctrl.changePassword);
auth.post("/register", limitter(authLimiter.register), ctrl.register);
auth.post("/reset-password", limitter(authLimiter.passwordReset), ctrl.resetPassword);
auth.post("/forgot-password", limitter(authLimiter.passwordForgot), ctrl.forgotPassword);
auth.post("/resend-verification-email", limitter(authLimiter.resendVerificationEmail), ctrl.resendVerificationEmail);
auth.post("/verify-email", limitter(authLimiter.verifyEmail), ctrl.verifyEmail);
auth.get("/me", protect, limitter(authLimiter.getMe), ctrl.getMe);

export default auth;
