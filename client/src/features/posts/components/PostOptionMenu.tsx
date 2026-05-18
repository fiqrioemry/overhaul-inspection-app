import { toast } from "sonner";
import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import type { Post } from "@/types/posts.type";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { useFollowUser, useUnfollowUser } from "@/features/users/users.query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PostOptionMenuProps {
  post: Post;
}

export default function PostOptionMenu({ post }: PostOptionMenuProps) {
  const { user } = useAuthStore();
  const unfollow = useUnfollowUser(post.user.id);
  const follow = useFollowUser(post.user.id);

  function followUser() {
    const action = post.isFollowing ? unfollow : follow;
    action.mutate();
  }

  async function savePost() {
    toast.success("You saved this post");
    // TODO: Implement save post API call
  }

  async function reportPost() {
    toast.success("You reported this post");
    // TODO: Implement report post API call
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
          <button className="w-full" onClick={savePost}>
            <DropdownMenuItem className="cursor-pointer">Save Post</DropdownMenuItem>
          </button>
          {user?.id !== post.user.id && (
            <button className="w-full" onClick={followUser}>
              <DropdownMenuItem className={post.isFollowing ? "text-destructive" : "text-blue-500"}>{post.isFollowing ? "Unfollow" : "Follow"}</DropdownMenuItem>
            </button>
          )}
          <button className="w-full" onClick={reportPost}>
            <DropdownMenuItem className="cursor-pointer text-red-500">Report</DropdownMenuItem>
          </button>
          <DropdownMenuItem className="cursor-pointer">Cancel</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
