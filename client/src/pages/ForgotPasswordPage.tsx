import { useLanguage } from "@/hooks/useLanguage";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  const { isEnglish, toggleLanguage } = useLanguage();

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
          <h2 className="text-4xl font-bold text-primary-foreground">Reset your password.</h2>
          <p className="text-primary-foreground/60 text-base max-w-xs">
            Enter your email and we'll send instructions to reset your password.
          </p>
        </div>
        <span className="relative text-primary-foreground/25 text-xs">© 2026 SSIE Tank Progress</span>
      </div>

      <div className="flex-1 flex flex-col min-h-screen bg-background">
        <div className="flex items-center justify-between px-6 py-5">
          <span className="lg:hidden font-bold text-xl tracking-tight text-foreground">
            Overhaul<span className="text-primary">.</span>
          </span>
          <div className="ml-auto flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => !isEnglish && toggleLanguage()}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${isEnglish ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span>🇺🇸</span> EN
            </button>
            <button
              type="button"
              onClick={() => isEnglish && toggleLanguage()}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${!isEnglish ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span>🇮🇩</span> ID
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 pb-10">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
