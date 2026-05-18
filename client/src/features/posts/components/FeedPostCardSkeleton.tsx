// src/features/posts/components/FeedPostCardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedPostCardSkeleton() {
  return (
    <div className="flex flex-col border-b">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-2.5 w-16 rounded" />
        </div>
      </div>

      {/* Image */}
      <Skeleton className="aspect-square w-full" />

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-2">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="ml-auto h-6 w-6 rounded" />
      </div>

      {/* Counts */}
      <div className="flex flex-col gap-1 px-4 pb-2">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>

      {/* Caption */}
      <div className="flex flex-col gap-1 px-4 pb-3">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-3/4 rounded" />
      </div>

      {/* Comment input */}
      <div className="border-t px-4 py-3">
        <Skeleton className="h-4 w-full rounded" />
      </div>
    </div>
  );
}
