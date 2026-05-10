import { Hono } from "hono";
import { protect } from "@/middlewares/auth";
import { singleFile } from "@/middlewares/file";
import { limitter } from "@/middlewares/limitter";
import userLimit from "@/config/common/userLimit";
import fileLimiter from "@/config/common/fileLimit";
import { UserController as ctrl } from "@/controllers/user.controller";

const user = new Hono();

user.get("", protect, limitter(userLimit.searchUsers), ctrl.searchUsersByUsername);
user.get("/profile/:username", protect, limitter(userLimit.getProfile), ctrl.getUserProfile);
user.put("/profile", protect, limitter(userLimit.updateProfile), ctrl.updateProfile);
user.patch("/profile/avatar", protect, limitter(userLimit.updateAvatar), singleFile(fileLimiter.avatarOptions, "avatar"), ctrl.updateAvatar);

export default user;
