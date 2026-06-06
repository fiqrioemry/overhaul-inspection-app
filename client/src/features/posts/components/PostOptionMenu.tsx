// src/features/posts/components/PostOptionMenu.tsx
import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import type { Post } from "@/types/posts.type";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { usePostStore } from "@/stores/post.store";
import EditPostDialog from "@/features/posts/components/EditPostDialog";
import ReportPostDialog from "@/features/posts/components/ReportPostDialog";
import { useFollowUser, useUnfollowUser } from "@/features/users/users.query";
import { useDeletePost, useSavePost, useUnsavePost } from "@/features/posts/posts.query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PostOptionMenuProps {
  post: Post;
}

export default function PostOptionMenu({ post }: PostOptionMenuProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const savePost = useSavePost(post.id);
  const unsavePost = useUnsavePost(post.id);
  const unfollow = useUnfollowUser(post.user.id);
  const follow = useFollowUser(post.user.id);
  const deletePost = useDeletePost(post.id);

  const { isOpen, target, openDialog, openEditDialog, openReportDialog } = usePostStore();

  const isOwnPost = user?.id === post.user.id;

  function followUser() {
    const action = post.isFollowing ? unfollow : follow;
    action.mutate();
  }

  async function handleSavePost() {
    const action = post.isSaved ? unsavePost : savePost;
    action.mutate();
  }

  async function handleDeletePost() {
    deletePost.mutateAsync();
    if (isOpen && target === post.id) openDialog({ isOpen: false, target: "" });
  }

  async function handleEditPost() {
    if (post.isEditable) {
      openEditDialog({ isEditOpen: true, editTarget: post.id });
    }
  }

  async function handleReportPost() {
    openReportDialog({ isReportOpen: true, reportTarget: post.id });
  }

  return (
    <div className="flex items-center gap-2">
      <EditPostDialog post={post} />

      {!isOwnPost && !post.isReported && <ReportPostDialog post={post} />}

      {!isOwnPost && (
        <Button variant="outline" size="sm" onClick={followUser}>
          {post.isFollowing ? "Unfollow" : "Follow"}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Post options">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              openDialog({ isOpen: false, target: "" });
              navigate(`/p/${post.id}`);
            }}
          >
            Go to post
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className={`cursor-pointer ${post.isSaved ? "text-destructive" : "text-blue-500"}`} onClick={handleSavePost}>
            {post.isSaved ? "Unsave" : "Save"}
          </DropdownMenuItem>

          {!isOwnPost && (
            <DropdownMenuItem className={`cursor-pointer ${post.isFollowing ? "text-destructive" : "text-blue-500"}`} onClick={followUser}>
              {post.isFollowing ? "Unfollow" : "Follow"}
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {isOwnPost ? (
            <>
              <DropdownMenuItem className="cursor-pointer text-blue-500" onClick={handleEditPost}>
                Edit post
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleDeletePost}>
                Delete post
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem className={post.isReported ? "text-green-500 " : "cursor-pointer text-destructive focus:text-destructive"} onClick={handleReportPost}>
              {post.isReported ? "Report submitted" : "Report post"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
