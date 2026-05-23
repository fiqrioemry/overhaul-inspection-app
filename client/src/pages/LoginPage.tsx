import LoginForm from "@/features/auth/components/LoginForm";
import { Helmet } from "react-helmet-async";

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title>Login - Pixel social media</title>
        <meta name="description" content="Login to access your dashboard and manage your account." />
        <meta name="keywords" content="login, authentication, dashboard" />
        <meta property="og:title" content="Login - Pixel social media" />
        <meta property="og:description" content="Login to access your dashboard and manage your account." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pixel.ahmadfiqrioemry/login" />
      </Helmet>

      <div className="flex items-center justify-center min-h-screen container mx-auto">
        <LoginForm />
      </div>
    </>
  );
}
