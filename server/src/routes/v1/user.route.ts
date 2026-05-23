import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { singleFile } from "@/middlewares/file.middleware";
import { userLimit } from "@/config/constant/user.constant";
import { fileLimit } from "@/config/constant/file.constant";
import { limitter } from "@/middlewares/limitter.middleware";
import { UserController as ctrl } from "@/modules/users/user.controller";

const user = new Hono();

user.get("", protect, limitter(userLimit.SEARCH_USERS), ctrl.searchUsersByUsername);
user.post("/follow/accept", protect, limitter(userLimit.ACCEPT_FOLLOW_REQUEST), ctrl.acceptFollowRequest);
user.post("/follow/reject", protect, limitter(userLimit.REJECT_FOLLOW_REQUEST), ctrl.rejectFollowRequest);
user.post("/follow", protect, limitter(userLimit.FOLLOW_USER), ctrl.followUser);
user.post("/unfollow", protect, limitter(userLimit.UNFOLLOW_USER), ctrl.unfollowUser);
user.get("/followers", protect, limitter(userLimit.GET_FOLLOWERS), ctrl.getFollowers);
user.get("/followings", protect, limitter(userLimit.GET_FOLLOWING), ctrl.getFollowing);
user.get("/profile/:username", protect, limitter(userLimit.GET_PROFILE), ctrl.getUserProfile);
user.put("/profile", protect, limitter(userLimit.UPDATE_PROFILE), ctrl.updateProfile);
user.patch("/profile/privacy", protect, limitter(userLimit.UPDATE_PROFILE), ctrl.updatePrivacy);
user.patch("/profile/avatar", protect, limitter(userLimit.UPDATE_AVATAR), singleFile(fileLimit.AVATAR_OPTIONS, "avatar"), ctrl.updateAvatar);
user.get("/follow/requests", protect, limitter(userLimit.GET_FOLLOW_REQUESTS), ctrl.getFollowRequests);

export default user;
