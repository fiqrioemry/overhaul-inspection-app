import { toast } from "sonner";
import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import type { Post } from "@/types/posts.type";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { useDeletePost, useSavePost, useUnsavePost } from "@/features/posts/posts.query";
import { useFollowUser, useUnfollowUser } from "@/features/users/users.query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePostStore } from "@/stores/post.store";

interface PostOptionMenuProps {
  post: Post;
}

export default function PostOptionMenu({ post }: PostOptionMenuProps) {
  const { user } = useAuthStore();
  const savePost = useSavePost(post.id);
  const unsavePost = useUnsavePost(post.id);
  const unfollow = useUnfollowUser(post.user.id);
  const follow = useFollowUser(post.user.id);
  const deletePost = useDeletePost(post.id);
  const { isOpen, target, openDialog } = usePostStore();

  function followUser() {
    const action = post.isFollowing ? unfollow : follow;
    action.mutate();
  }

  async function handleSavePost() {
    const action = post.isSaved ? unsavePost : savePost;
    action.mutate();
  }

  async function handleReportPost() {
    toast.success("You reported this post");
    // TODO: Implement report post API call
  }

  async function handleDeletePost() {
    deletePost.mutateAsync();
    if (isOpen && target === post.id) openDialog({ isOpen: false, target: "" });
  }

  async function handleEditPost() {
    toast.success("You edited this post");
    // TODO: Implement edit post API call
  }

  return (
    <div className="flex items-center gap-2">
      {user?.id !== post.user.id && (
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
        <DropdownMenuContent align="end" className="w-40">
          <Link to={`/p/${post.id}`} className="block w-full">
            <DropdownMenuItem className="cursor-pointer">Go to post</DropdownMenuItem>
          </Link>
          <button className="w-full" onClick={handleSavePost}>
            <DropdownMenuItem className={`${post.isSaved ? "text-destructive" : "text-blue-500"} cursor-pointer`}>{post.isSaved ? "Unsave" : "Save"}</DropdownMenuItem>
          </button>
          {user?.id !== post.user.id && (
            <button className="w-full" onClick={followUser}>
              <DropdownMenuItem className={`${post.isFollowing ? "text-destructive" : "text-blue-500"} cursor-pointer`}>{post.isFollowing ? "Unfollow" : "Follow"}</DropdownMenuItem>
            </button>
          )}
          <button className="w-full" onClick={handleEditPost}>
            <DropdownMenuItem className={`${post.isEditable ? "text-destructive" : "text-blue-500"} cursor-pointer`}>{post.isEditable ? "Edit" : "View"}</DropdownMenuItem>
          </button>
          <button className="w-full" onClick={post.isEditable ? handleDeletePost : handleReportPost}>
            <DropdownMenuItem className={`${post.isEditable ? "text-destructive" : "text-destructive"} cursor-pointer`}>{post.isEditable ? "Delete" : "Report"}</DropdownMenuItem>
          </button>
          <DropdownMenuItem className="cursor-pointer">Cancel</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
