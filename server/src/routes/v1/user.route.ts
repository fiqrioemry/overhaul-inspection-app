import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { singleFile } from "@/middlewares/file.middleware";
import { userLimit } from "@/config/constant/user.constant";
import { fileLimit } from "@/config/constant/file.constant";
import { limitter } from "@/middlewares/limitter.middleware";
import { UserController as ctrl } from "@/modules/users/user.controller";

const user = new Hono();

user.put("/profile", protect, limitter(userLimit.UPDATE_PROFILE), ctrl.updateProfile);
user.patch("/profile/avatar", protect, limitter(userLimit.UPDATE_AVATAR), singleFile(fileLimit.AVATAR_OPTIONS, "avatar"), ctrl.updateAvatar);

export default user;
