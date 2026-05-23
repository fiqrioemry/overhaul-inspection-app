import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import { Helmet } from "react-helmet-async";

export default function ForgotPasswordPage() {
  return (
    <>
      <Helmet>
        <title>Forgot Password - Pixel social media</title>
        <meta name="description" content="Reset your password on Pixel social media." />
        <meta name="keywords" content="forgot password, reset password, social media" />
        <meta property="og:title" content="Forgot Password - Pixel social media" />
        <meta property="og:description" content="Reset your password on Pixel social media." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pixel.ahmadfiqrioemry.com/forgot-password" />
      </Helmet>
      <div className="flex items-center justify-center min-h-screen container mx-auto">
        <ForgotPasswordForm />
      </div>
    </>
  );
}
