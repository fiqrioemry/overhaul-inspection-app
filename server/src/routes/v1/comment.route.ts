import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { CommentController as ctrl } from "@/modules/comments/comment.controller";

const comment = new Hono();

comment.post("", protect, ctrl.createComment);
comment.get("/:postId/comments", protect, ctrl.getParentComments);
comment.get("/:postId/comments/:commentId", protect, ctrl.getChildComments);
comment.put("/:postId/comments", protect, ctrl.editComment);
comment.post("/:commentId/like", protect, ctrl.likeComment);
comment.post("/:commentId/unlike", protect, ctrl.unlikeComment);
comment.delete("/:commentId", protect, ctrl.deleteComment);
// total endpoints: 6

export default comment;
