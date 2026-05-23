export default function PostDetailSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl border h-[90vh] flex flex-col md:flex-row animate-pulse bg-background">
      {/* image skeleton */}
      <div className="md:w-1/2 bg-muted shrink-0">
        <div className="w-full h-full min-h-[300px]" />
      </div>

      {/* content skeleton */}
      <div className="flex flex-col flex-1">
        {/* header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="w-10 h-10 rounded-full bg-muted" />

          <div className="space-y-2">
            <div className="w-32 h-4 rounded bg-muted" />
            <div className="w-20 h-3 rounded bg-muted" />
          </div>
        </div>

        {/* comments */}
        <div className="flex-1 space-y-5 p-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0" />

              <div className="flex-1 space-y-2">
                <div className="w-24 h-3 rounded bg-muted" />
                <div className="w-full h-3 rounded bg-muted" />
                <div className="w-2/3 h-3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* actions */}
        <div className="border-t p-4 space-y-3">
          <div className="flex gap-4">
            <div className="w-6 h-6 rounded bg-muted" />
            <div className="w-6 h-6 rounded bg-muted" />
            <div className="w-6 h-6 rounded bg-muted" />
          </div>

          <div className="w-24 h-3 rounded bg-muted" />
          <div className="w-20 h-3 rounded bg-muted" />
        </div>

        {/* input */}
        <div className="border-t p-4">
          <div className="w-full h-10 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
