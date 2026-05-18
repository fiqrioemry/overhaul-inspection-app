// src/features/posts/components/FeedPostCard.tsx
import { Link } from "react-router-dom";
import type { Post } from "@/types/posts.type";
import { formatDistanceToNow } from "date-fns";
import PostOptionMenu from "@/features/posts/components/PostOptionMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PostHeadingProps {
  post: Post;
}

export default function PostHeading({ post }: PostHeadingProps) {
  const createdAt = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "";

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 ring-2 ring-offset-1 ring-gradient-to-tr ring-pink-500">
          <AvatarImage src={post.user?.avatar ?? "/default-avatar.png"} alt={post.user?.username} />
          <AvatarFallback className="text-xs font-bold">{post.user?.username?.slice(0, 2).toUpperCase() ?? "U"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <Link to={`/profile/${post.user?.username}`} className="text-sm font-semibold leading-tight hover:underline">
            {post.user?.username}
          </Link>
          <span className="text-xs text-muted-foreground leading-tight">{createdAt}</span>
        </div>
      </div>
      <PostOptionMenu post={post} />
    </div>
  );
}
