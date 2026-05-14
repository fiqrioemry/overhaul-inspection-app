import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { fileLimit } from "@/config/constant/file.constant";
import { postLimit } from "@/config/constant/post.constant";
import { limitter } from "@/middlewares/limitter.middleware";
import { multipleFile } from "@/middlewares/file.middleware";
import { PostController as ctrl } from "@/modules/posts/post.controller";

const post = new Hono();

post.get("/following", protect, limitter(postLimit.GET_FOLLOWING_POSTS), ctrl.getFollowingPosts);
post.get("/public", protect, limitter(postLimit.GET_PUBLIC_POSTS), ctrl.getPublicPosts);
post.get("/:targetId/user", protect, limitter(postLimit.GET_POST_BY_USER_ID), ctrl.getPostsByUserId);
post.get("/:postId", protect, limitter(postLimit.GET_POST_BY_ID), ctrl.getPostById);
post.post("", protect, limitter(postLimit.CREATE_POST), multipleFile(fileLimit.POST_FILE_OPTIONS, "posts"), ctrl.createPost);
post.put("/:postId", protect, limitter(postLimit.UPDATE_POST), ctrl.updatePost);
post.post("/:postId/like", protect, limitter(postLimit.LIKE_POST), ctrl.likePost);
post.post("/:postId/unlike", protect, limitter(postLimit.UNLIKE_POST), ctrl.unlikePost);
post.delete("/:postId", protect, limitter(postLimit.DELETE_POST), ctrl.deletePost);
// total endpoints: 9

export default post;
