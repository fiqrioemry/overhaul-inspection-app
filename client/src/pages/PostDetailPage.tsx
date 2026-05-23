import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { usePostById } from "@/features/posts/posts.query";
import PostNotFound from "@/features/posts/components/PostNotFound";
import PostDetailCard from "@/features/posts/components/PostDetailCard";
import PostDetailSkeleton from "@/features/posts/components/PostDetailSkeleton";

export default function PostDetailPage() {
  const postId = useParams().postId;
  const { data: post, isLoading } = usePostById(postId ?? "");

  if (isLoading) return <PostDetailSkeleton />;

  if (!postId || !post?.data) return <PostNotFound />;

  return (
    <>
      <Helmet>
        <title>Post Detail - Pixel social media</title>
        <meta name="description" content="View the details of a specific post on Pixel social media." />
        <meta name="keywords" content="post, social media, detail" />
        <meta property="og:title" content="Post Detail - Pixel social media" />
        <meta property="og:description" content="View the details of a specific post on Pixel social media." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://pixel.ahmadfiqrioemry.com/posts/${postId}`} />
      </Helmet>
      <div className="min-h-screen mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center h-screen">
          <PostDetailCard post={post?.data} />
        </div>
      </div>
    </>
  );
}
