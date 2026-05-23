import { Helmet } from "react-helmet-async";
import RegisterForm from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <Helmet>
        <title>Register - Pixel social media</title>
        <meta name="description" content="Register to create a new account and join the Pixel social media community." />
        <meta name="keywords" content="register, sign up, authentication, dashboard" />
        <meta property="og:title" content="Register - Pixel social media" />
        <meta property="og:description" content="Register to create a new account and join the Pixel social media community." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pixel.ahmadfiqrioemry.com/register" />
      </Helmet>
      <div className="flex items-center justify-center min-h-screen container mx-auto">
        <RegisterForm />
      </div>
    </>
  );
}
