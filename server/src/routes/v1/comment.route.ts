import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { CommentController as ctrl } from "@/controllers/comment.controller";

const comment = new Hono();

comment.get("/:postId/comments", protect, ctrl.getParentComments);
comment.get("/:postId/comments/:commentId", protect, ctrl.getChildComments);
comment.post("/:postId/comments", protect, ctrl.createComment);
comment.put("/:postId/comments", protect, ctrl.editComment);
comment.post("/:commentId/like", protect, ctrl.likeComment);
comment.post("/:commentId/unlike", protect, ctrl.unlikeComment);
// total endpoints: 6

export default comment;
