import { Hono } from "hono";
import { protect } from "@/middlewares/auth";
import { limitter } from "@/middlewares/limitter";
import { multipleFile } from "@/middlewares/file";
import postLimit from "@/config/common/postLimit";
import fileLimiter from "@/config/common/fileLimit";
import { PostController as ctrl } from "@/controllers/post.controller";

const post = new Hono();

post.post("", protect, limitter(postLimit.createPost), multipleFile(fileLimiter.postFileOptions, "posts"), ctrl.createPost);
post.get("/following", protect, limitter(postLimit.getFollowingPosts), ctrl.getFollowingPosts);
post.get("/public", ctrl.getPublicPosts);
post.get("/:targetId/user", protect, ctrl.getPostsByUserId);
post.get("/:postId", ctrl.getPostById);
post.put("/:postId", protect, limitter(postLimit.updatePost), ctrl.updatePost);
post.delete("/:postId", protect, ctrl.deletePost);
post.patch("/:postId/like", protect, ctrl.likePost);
post.patch("/:postId/unlike", protect, ctrl.unlikePost);

export default post;
