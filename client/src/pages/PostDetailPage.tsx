import { usePostById } from "@/features/posts/posts.query";
import PostDetailCard from "@/features/posts/components/PostDetailCard";
import { useParams } from "react-router-dom";

export default function PostDetailPage() {
  const postId = useParams().postId;
  const { data: post, isLoading } = usePostById(postId ?? "");

  if (isLoading) return <div>Loading...</div>;

  if (!postId || !post?.data) return <div>Post not found</div>;

  return (
    <div className="min-h-screen mx-auto max-w-7xl">
      <div className="flex flex-col items-center justify-center h-screen">
        <PostDetailCard post={post?.data} />
      </div>
    </div>
  );
}
