import { Hono } from "hono";
import { limitter } from "@/middlewares/limitter";
import { AuthController as ctrl } from "@/controllers/auth.controller";
import authLimiter from "@/config/common/authLimit";

const auth = new Hono();
auth.post("/login", limitter(authLimiter.login), ctrl.login);
auth.post("/logout", ctrl.logout);
auth.post("/logout-all", ctrl.logoutAll);
auth.get("/sessions", limitter(authLimiter.sessions), ctrl.getSessions);
auth.patch("/change-password", limitter(authLimiter.passwordReset), ctrl.changePassword);
auth.post("/register", limitter(authLimiter.register), ctrl.register);
auth.post("/reset-password", limitter(authLimiter.passwordReset), ctrl.resetPassword);
auth.post("/forgot-password", limitter(authLimiter.passwordReset), ctrl.forgotPassword);
auth.post("/verify-email", limitter(authLimiter.verifyEmail), ctrl.verifyEmail);
auth.get("/me");

export default auth;
