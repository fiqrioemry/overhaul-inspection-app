import { Hono } from "hono";
import common from "@/config/common";
import { limitter } from "@/middlewares/limitter";
import { AuthController as ctrl } from "@/controllers/auth.controller";

const auth = new Hono();
auth.post("/login", limitter(common.LIMIT.LOGIN), ctrl.login);
auth.post("/logout", ctrl.logout);
auth.post("/logout-all", ctrl.logoutAll);
auth.get("/sessions", limitter(common.LIMIT.SESSIONS), ctrl.getSessions);
auth.patch("/change-password", limitter(common.LIMIT.PASSWORD_RESET), ctrl.changePassword);
auth.post("/register", limitter(common.LIMIT.REGISTER), ctrl.register);
auth.post("/reset-password", limitter(common.LIMIT.PASSWORD_RESET), ctrl.resetPassword);
auth.post("/forgot-password", limitter(common.LIMIT.PASSWORD_RESET), ctrl.forgotPassword);
auth.post("/verify-email", limitter(common.LIMIT.VERIFY_EMAIL), ctrl.verifyEmail);
auth.get("/me");

export default auth;
