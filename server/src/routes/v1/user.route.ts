import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { singleFile, optionalFile } from "@/middlewares/file.middleware";
import { userLimit } from "@/config/constant/user.constant";
import { fileLimit } from "@/config/constant/file.constant";
import { limitter } from "@/middlewares/limitter.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { UserController as ctrl } from "@/modules/users/user.controller";

const user = new Hono();

// SUPER_ADMIN / ADMIN user management
user.post("/", protect, requirePermission(PERMISSIONS.USER_CREATE), ctrl.createUser);
user.get("/", protect, requirePermission(PERMISSIONS.USER_READ), limitter(userLimit.GET_USERS), ctrl.listUsers);
user.get("/:id", protect, requirePermission(PERMISSIONS.USER_READ), ctrl.getUserById);
user.patch("/:id", protect, requirePermission(PERMISSIONS.USER_UPDATE), optionalFile(fileLimit.AVATAR_OPTIONS, "avatar"), ctrl.updateUser);
user.patch("/:id/status", protect, requirePermission(PERMISSIONS.USER_UPDATE), ctrl.updateUserStatus);
user.patch("/:id/password", protect, requirePermission(PERMISSIONS.USER_UPDATE), ctrl.updateUserPassword);
user.delete("/:id", protect, requirePermission(PERMISSIONS.USER_DELETE), ctrl.deleteUser);

// Self-service profile endpoints
user.put("/profile", protect, limitter(userLimit.UPDATE_PROFILE), ctrl.updateProfile);
user.patch("/profile/avatar", protect, limitter(userLimit.UPDATE_AVATAR), singleFile(fileLimit.AVATAR_OPTIONS, "avatar"), ctrl.updateAvatar);

export default user;
