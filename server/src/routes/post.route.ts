import { Hono } from "hono";
import { protect } from "@/middlewares/auth";
import { limitter } from "@/middlewares/limitter";
import { multipleFile } from "@/middlewares/file";
import postLimit from "@/config/common/postLimit";
import fileLimiter from "@/config/common/fileLimit";
import { PostController as ctrl } from "@/controllers/post.controller";

const post = new Hono();

post.get("/following", protect, limitter(postLimit.getFollowingPosts), ctrl.getFollowingPosts);
post.get("/public", protect, limitter(postLimit.getPublicPosts), ctrl.getPublicPosts);
post.get("/:targetId/user", protect, limitter(postLimit.getPostByUserId), ctrl.getPostsByUserId);
post.get("/:postId", protect, limitter(postLimit.getPostById), ctrl.getPostById);
post.post("", protect, limitter(postLimit.createPost), multipleFile(fileLimiter.postFileOptions, "posts"), ctrl.createPost);
post.put("/:postId", protect, limitter(postLimit.updatePost), ctrl.updatePost);
post.post("/:postId/like", protect, limitter(postLimit.likePost), ctrl.likePost);
post.post("/:postId/unlike", protect, limitter(postLimit.unlikePost), ctrl.unlikePost);
post.delete("/:postId", protect, limitter(postLimit.deletePost), ctrl.deletePost);

export default post;
