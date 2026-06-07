import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useUserProfile } from "@/features/users/users.query";
import ProfileHeader from "@/features/users/components/ProfileHeader";
import ProfilePostsTab from "@/features/users/components/ProfilePostsTab";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { t } = useTranslation(["setting"]);
  const { username } = useParams<{ username: string }>();
  const { data, isLoading, isError, refetch } = useUserProfile(username ?? "");
  const profile = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2">
        <p className="text-sm font-semibold">{t("setting:profileNotFound")}</p>
        <p className="text-xs text-muted-foreground">{t("setting:profileNotFoundMessage")}</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t("setting:profilePageTitle")}</title>
        <meta name="description" content={t("setting:profilePageDescription")} />
        <meta name="keywords" content={t("setting:profilePageKeywords")} />
        <meta property="og:title" content={t("setting:profilePageTitle")} />
        <meta property="og:description" content={t("setting:profilePageDescription")} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://pixel.ahmadfiqrioemry.com/users/${username}`} />
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <ProfileHeader profile={profile} refetchProfile={refetch} />
        <Separator />
        {/* when profile is not public only followers can see the posts */}
        {profile.isOwner || profile.isPublic || profile.followStatus === "ACCEPTED" ? (
          <ProfilePostsTab userId={profile.id} isOwner={profile.isOwner} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <p className="text-sm font-semibold">{t("setting:profileIsPrivate")}</p>
            <p className="text-xs text-muted-foreground">{t("setting:profileIsPrivateMessage")}</p>
          </div>
        )}
      </div>
    </>
  );
}
