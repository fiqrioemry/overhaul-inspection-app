// src/components/common/PostCardSkeleton.tsx
export default function PostCardSkeleton() {
  return (
    <div className="aspect-square overflow-hidden rounded-lg bg-muted animate-pulse">
      <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
    </div>
  );
}
