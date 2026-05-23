import { useSearchParams } from "react-router-dom";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";
import { Helmet } from "react-helmet-async";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  return (
    <>
      <Helmet>
        <title>Reset Password - Pixel social media</title>
        <meta name="description" content="Reset your password on Pixel social media." />
        <meta name="keywords" content="reset password, social media, user" />
        <meta property="og:title" content="Reset Password - Pixel social media" />
        <meta property="og:description" content="Reset your password on Pixel social media." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://pixel.ahmadfiqrioemry.com/reset-password?token=${token}`} />
      </Helmet>
      <div className="flex items-center justify-center min-h-screen container mx-auto">
        <ResetPasswordForm token={token} />
      </div>
    </>
  );
}
