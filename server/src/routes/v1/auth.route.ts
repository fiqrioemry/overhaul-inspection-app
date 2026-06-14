import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { authLimit } from "@/config/constant/auth.constant";
import { limitter } from "@/middlewares/limitter.middleware";
import { AuthController as ctrl } from "@/modules/auth/auth.controller";

const auth = new Hono();

auth.post("/login", limitter(authLimit.LOGIN), ctrl.login);
auth.post("/logout", protect, ctrl.logout);
auth.post("/refresh-token", protect, ctrl.refreshToken);
auth.get("/me", protect, limitter(authLimit.GET_ME), ctrl.getMe);
auth.post("/forgot-password", limitter(authLimit.PASSWORD_FORGOT), ctrl.forgotPassword);
auth.post("/reset-password", limitter(authLimit.PASSWORD_RESET), ctrl.resetPassword);
auth.post("/verify-email", limitter(authLimit.VERIFY_EMAIL), ctrl.verifyEmail);
auth.post("/resend-verification-email", limitter(authLimit.RESEND_VERIFICATION_EMAIL), ctrl.resendVerificationEmail);
auth.patch("/change-password", protect, limitter(authLimit.PASSWORD_CHANGE), ctrl.changePassword);
auth.post("/set-password", protect, limitter(authLimit.PASSWORD_SET), ctrl.setPassword);
auth.post("/sessions-revoke", protect, ctrl.logoutAll);
auth.delete("/sessions/:sessionId", protect, ctrl.deleteSession);
auth.get("/sessions", protect, limitter(authLimit.SESSIONS), ctrl.getSessions);
auth.post("/2fa/setup", protect, limitter(authLimit.TWO_FACTOR_SETUP), ctrl.setup2FA);
auth.post("/2fa/verify", protect, limitter(authLimit.TWO_FACTOR_VERIFY), ctrl.verify2FA);
auth.delete("/2fa/disable", protect, limitter(authLimit.TWO_FACTOR_DISABLE), ctrl.disable2FA);
auth.post("/2fa/challenge", limitter(authLimit.TWO_FACTOR_CHALLENGE), ctrl.challenge2FA);
auth.get("/:provider", ctrl.oauthRedirect);
auth.get("/:provider/callback", ctrl.oauthCallback);

export default auth;
