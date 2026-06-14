import { useSearchParams, Navigate } from "react-router-dom";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";
import { ROUTES } from "@/constants/route.constant";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!token) return <Navigate to={ROUTES.FORGOT_PASSWORD} replace />;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[42%] bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <span className="relative font-bold text-2xl tracking-tight text-primary-foreground">
          Overhaul<span className="opacity-50">.</span>
        </span>
        <div className="relative space-y-3">
          <h2 className="text-4xl font-bold text-primary-foreground">Set your new password.</h2>
          <p className="text-primary-foreground/60 text-base max-w-xs">
            Choose a strong password to secure your account.
          </p>
        </div>
        <span className="relative text-primary-foreground/25 text-xs">© 2026 SSIE Tank Progress</span>
      </div>

      <div className="flex-1 flex flex-col min-h-screen bg-background">
        <div className="flex items-center px-6 py-5">
          <span className="lg:hidden font-bold text-xl tracking-tight text-foreground">
            Overhaul<span className="text-primary">.</span>
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 pb-10">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
