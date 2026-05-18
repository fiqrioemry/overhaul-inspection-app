// src/components/common/PostGridSkeleton.tsx
import PostCardSkeleton from "./PostCardSkeleton";

interface PostGridSkeletonProps {
  count?: number;
}

export default function PostGridSkeleton({ count = 9 }: PostGridSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </>
  );
}
