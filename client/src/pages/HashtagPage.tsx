// src/pages/HashtagPage.tsx
import { useParams, Link } from "react-router-dom";
import { Hash, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import HashtagPostList from "@/features/hashtags/components/HashtagPostList";
import { useTrendingHashtags } from "@/features/hashtags/hashtags.query";

export default function HashtagPage() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name ?? "");

  const { data: trendingData } = useTrendingHashtags(20);
  const hashtagMeta = trendingData?.data?.find((h) => h.name === decodedName);

  return (
    <>
      <Helmet>
        <title>#{decodedName} - Pixel social media</title>
        <meta name="description" content={`Posts tagged with #${decodedName} on Pixel social media.`} />
        <meta property="og:title" content={`#${decodedName} - Pixel social media`} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="space-y-3">
          <Link to="/explore" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" />
            Back to Explore
          </Link>

          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Hash className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">#{decodedName}</h1>
              {hashtagMeta && (
                <p className="text-sm text-muted-foreground">
                  {hashtagMeta.postCount.toLocaleString()} {hashtagMeta.postCount === 1 ? "post" : "posts"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Posts grid */}
        {decodedName && <HashtagPostList name={decodedName} />}
      </div>
    </>
  );
}
